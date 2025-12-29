from flask_sqlalchemy import SQLAlchemy
from passlib.hash import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), default='user')  # 'admin' or 'user'

    def set_password(self, password: str):
        self.password_hash = bcrypt.hash(password)

    def check_password(self, password: str) -> bool:
        try:
            return bcrypt.verify(password, self.password_hash)
        except Exception:
            return False

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'role': self.role}


class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    product = db.Column(db.String(255), nullable=False)
    sales = db.Column(db.Integer, default=0)
    category = db.Column(db.String(128), nullable=True)
    revenue = db.Column(db.Float, default=0.0)
    profit = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'Product': self.product,
            'Sales': int(self.sales) if self.sales is not None else 0,
            'Category': self.category,
            'Revenue': float(self.revenue) if self.revenue is not None else 0,
            'Profit': float(self.profit) if self.profit is not None else 0
        }

    @classmethod
    def from_dict(cls, data):
        # Accept both old keys (Product, Sales...) and new ones
        product = data.get('Product') or data.get('product') or 'Unnamed'
        sales = data.get('Sales') or data.get('sales') or 0
        category = data.get('Category') or data.get('category') or None
        revenue = data.get('Revenue') or data.get('revenue') or 0
        profit = data.get('Profit') or data.get('profit') or 0
        return cls(product=product, sales=int(sales), category=category, revenue=float(revenue), profit=float(profit))
