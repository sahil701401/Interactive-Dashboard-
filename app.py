import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables from .env (optional)
load_dotenv()

# Simple Flask + SQLAlchemy setup
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Database configuration (defaults to a local SQLite file for quick local dev)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
default_sqlite = f"sqlite:///{os.path.join(BASE_DIR, 'backend', 'data.db')}"
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', default_sqlite)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Import models and initialize DB
from backend.models import db, Product, User

from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
)

# JWT setup
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change-me-in-prod')
jwt = JWTManager(app)


db.init_app(app)
migrate = Migrate(app, db)

# Create tables and seed sample data if empty
with app.app_context():
    db.create_all()
    if User.query.count() == 0:
        # Create a default admin user (change password via env var in production)
        admin_pass = os.environ.get('ADMIN_PASSWORD', 'adminpass')
        admin = User(username='admin', role='admin')
        admin.set_password(admin_pass)
        db.session.add(admin)
        db.session.commit()

    if Product.query.count() == 0:
        sample = [
            {'Product': 'Smartphone X', 'Sales': 150000, 'Category': 'Electronics', 'Revenue': 75000000, 'Profit': 15000000},
            {'Product': 'Wireless Earbuds Pro', 'Sales': 120000, 'Category': 'Electronics', 'Revenue': 9600000, 'Profit': 1920000},
            {'Product': 'Organic Toothpaste', 'Sales': 500000, 'Category': 'Personal Care', 'Revenue': 2000000, 'Profit': 400000},
            {'Product': 'Spiral Notebook', 'Sales': 350000, 'Category': 'Stationery', 'Revenue': 1050000, 'Profit': 210000},
            {'Product': 'Pure Cooking Oil', 'Sales': 420000, 'Category': 'Grocery', 'Revenue': 6300000, 'Profit': 315000},
            {'Product': 'Laundry Detergent', 'Sales': 280000, 'Category': 'Household', 'Revenue': 4200000, 'Profit': 420000}
        ]
        for s in sample:
            p = Product.from_dict(s)
            db.session.add(p)
        db.session.commit()

# GET all products (supports pagination via ?limit=&offset=)
@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', type=int)
        q = Product.query.order_by(Product.sales.desc())
        total = q.count()
        if limit is not None:
            q = q.limit(limit)
        if offset is not None:
            q = q.offset(offset)
        products = q.all()
        return jsonify({'total': total, 'items': [p.to_dict() for p in products]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# POST new product(s) — admin only
@app.route('/api/data', methods=['POST'])
@jwt_required()
def add_data():
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        payload = request.get_json()
        if not payload:
            return jsonify({'error': 'No data provided'}), 400

        items = payload if isinstance(payload, list) else [payload]
        added = []
        for it in items:
            # Basic validation
            if not (it.get('Product') or it.get('product')):
                return jsonify({'error': 'Product name is required'}), 400
            prod = Product.from_dict(it)
            db.session.add(prod)
            db.session.flush()
            added.append(prod.to_dict())
        db.session.commit()
        return jsonify({'status': 'success', 'added': len(added), 'items': added}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# UPDATE a product — admin only
@app.route('/api/data/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        payload = request.get_json() or {}
        prod = Product.query.get_or_404(product_id)
        # update allowed fields
        if 'Product' in payload or 'product' in payload:
            prod.product = payload.get('Product') or payload.get('product')
        if 'Sales' in payload or 'sales' in payload:
            prod.sales = int(payload.get('Sales') or payload.get('sales') or 0)
        if 'Category' in payload or 'category' in payload:
            prod.category = payload.get('Category') or payload.get('category')
        if 'Revenue' in payload or 'revenue' in payload:
            prod.revenue = float(payload.get('Revenue') or payload.get('revenue') or 0)
        if 'Profit' in payload or 'profit' in payload:
            prod.profit = float(payload.get('Profit') or payload.get('profit') or 0)
        db.session.commit()
        return jsonify({'status': 'success', 'item': prod.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# DELETE a product — admin only
@app.route('/api/data/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        prod = Product.query.get_or_404(product_id)
        db.session.delete(prod)
        db.session.commit()
        return jsonify({'status': 'deleted', 'id': product_id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'username already exists'}), 409
    user = User(username=username, role='user')
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'status': 'created', 'user': user.to_dict()}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'invalid credentials'}), 401
    access = create_access_token(identity=user.username, additional_claims={'role': user.role})
    return jsonify({'access_token': access, 'user': user.to_dict()})

# GET categories
@app.route('/api/categories', methods=['GET'])
def get_categories():
    cats = db.session.query(Product.category).distinct().all()
    return jsonify([c[0] for c in cats if c[0]])

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    identity = get_jwt_identity()
    claims = get_jwt()
    return jsonify({'username': identity, 'role': claims.get('role')})

# Health
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=int(os.environ.get('PORT', 5000)))
