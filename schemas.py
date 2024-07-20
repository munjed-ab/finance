from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from datetime import date, datetime
from decimal import Decimal
from typing_extensions import Annotated
from pydantic import BaseModel, StringConstraints
from models import Category

class UserCreate(BaseModel):
    username: Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True,min_length=3, max_length=150)]
    email: EmailStr
    password: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8)]
    password2: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8)]

class UserUpdate(BaseModel):
    username: Optional[Annotated[str, Field(strip_whitespace=True, min_length=3, max_length=150)]] = None
    email: Optional[EmailStr] = None

class UserResetPass(BaseModel):
    current_password: Annotated[str, Field(strip_whitespace=True, min_length=8, description="Current password is at least 8 characters long")]
    password: Annotated[str, Field(strip_whitespace=True, min_length=8, description="New password must be at least 8 characters long")]
    password2: Annotated[str, Field(strip_whitespace=True, min_length=8, description="New password must be at least 8 characters long")]

class User(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True
        use_enum_values = True


class UserProfile(BaseModel):
    username: str
    email: str
    is_superuser: bool

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True
        use_enum_values = True

class TransactionBase(BaseModel):
    amount: float
    type: str
    category: Optional[Category] = None
    currency: str
    description: Optional[str] = None
    date: date
    

class TransactionCreate(TransactionBase):
    category_name: str

class TransactionUpdate(TransactionBase):
    category_name: Optional[str] = None

class Transaction(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True

class Overview(BaseModel):
    month: Optional[str] = None
    year: str
    cur: str
    total_income: Decimal = 0.00
    total_expense: Decimal = 0.00
    income_by_category: Dict[str, Decimal] = {}
    expense_by_category: Dict[str, Decimal] = {}
    transactions: List[Transaction]

class ReportExVSIn(BaseModel):
    month: Optional[str] = None
    year: str
    cur: str
    transactions: List[Transaction]

class ReportExbyCat(BaseModel):
    expense_by_category: Dict[str, Decimal] = {}

class TransactionReport(BaseModel):
    transactions: List[Transaction]
