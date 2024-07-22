from passlib.context import CryptContext
from models import User, Transaction, Category, Project
from schemas import (
    TransactionCreate,
    TransactionUpdate,
    UserUpdate,
    Transaction as TransactionSchema,
    Category as CategorySchema
)
from typing import List
from typing import Optional
from decimal import Decimal
from datetime import date
from collections import defaultdict
from currency import convert_currency
from auth import hash_password, get_user_by_email


async def create_user(username: str, email: str, password: str):
    hashed_password = hash_password(password)
    user = await User.create(username=username, email=email, hashed_password=hashed_password)
    return user

async def update_user(user: User, user_update: UserUpdate) -> User:
    user.update_from_dict(user_update.model_dump(exclude_unset=True))
    await user.save()
    return user

# async def create_category(user: User, category_name: str) -> CategorySchema:
#     category = await Category.create(name=category_name)
#     return category

async def create_transaction(user: User, transaction: TransactionCreate) -> TransactionSchema:
    category, cat_created = await Category.get_or_create(name=str(transaction.category_name).lower().strip())
    project, pro_created = await Project.get_or_create(name=str(transaction.project_name).lower().strip(), user=user)
    transaction_data = transaction.model_dump(exclude={"category", "category_name", "project", "project_name"})
    transaction_obj = await Transaction.create(user=user, category=category, project=project, **transaction_data)
    
    return transaction_obj

async def get_transactions(user: User) -> List[TransactionSchema]:
    transactions = await Transaction.filter(user=user).prefetch_related('category', 'project')
    return transactions

async def update_transaction(user: User, transaction_id: int, transaction: TransactionUpdate) -> TransactionSchema:
    transaction_obj = await Transaction.get(id=transaction_id, user=user)
    if transaction_obj:
        category, cat_created = await Category.get_or_create(name=str(transaction.category_name).lower().strip())
        project, pro_created = await Project.get_or_create(name=str(transaction.project_name).lower().strip(), user=user)
        transaction_obj.update_from_dict(transaction.model_dump(exclude={'category_name', 'project_name'}))
        transaction_obj.category = category
        transaction_obj.project = project

        await transaction_obj.save()
        return transaction_obj
    return None

async def delete_transaction(user: User, transaction_id: int):
    transaction_obj = await Transaction.get(id=transaction_id, user=user)
    if transaction_obj:
        await transaction_obj.delete()
        return True
    return False


async def get_filtered_transactions(user: User, month: Optional[str], year: str, cur: str, project_id: str) -> dict:
    query = None
    if project_id == "all":
        query = Transaction.filter(user=user).prefetch_related('category', 'project')
    else:
        query = Transaction.filter(user=user, project=int(project_id)).prefetch_related('category', 'project')
    
    
    start_date, end_date = get_start_end_date(month, year)

    transactions = await query.all()
    
    transactions = [transaction for transaction in transactions if start_date <= transaction.date <= end_date]

    total_income = Decimal('0.00')
    total_expense = Decimal('0.00')

    income_by_category = defaultdict(Decimal)
    expense_by_category = defaultdict(Decimal)


    for transaction in transactions:
        transaction.amount = await convert_currency(transaction.amount, transaction.currency, cur)
        if transaction.type == 'Income':
            total_income += transaction.amount
            income_by_category[transaction.category.name] += transaction.amount
        elif transaction.type == 'Expense':
            total_expense += transaction.amount
            expense_by_category[transaction.category.name] += transaction.amount

    return {
        "month": month,
        "year": year,
        "cur": cur,
        'total_income': total_income,
        'total_expense': total_expense,
        'income_by_category': dict(income_by_category),
        'expense_by_category': dict(expense_by_category),
        'transactions' : transactions
    }


# helper function
def get_start_end_date(month: str, year: str) -> tuple[date, date]:
    start_date = date.today()
    end_date = date.today()
    if month == "all":
        start_date = date(int(year), 1, 1)
        end_date = date(int(year), 12, 31)
    else:
        start_date = date(int(year), int(month), 1)
        if month == "12":
            last_month_day = date(int(year) + 1, 1, 1) - start_date
        else:
            last_month_day = date(int(year), int(month) + 1, 1) - start_date
        end_date = date(int(year), int(month), last_month_day.days)
    return start_date, end_date


async def get_report_expense_vs_income(user: User, month: Optional[str], year: str, cur: str, project_id: str) -> dict:
    query = None
    if project_id == "all":
        query = Transaction.filter(user=user).prefetch_related('category', 'project')
    else:
        query = Transaction.filter(user=user, project=int(project_id)).prefetch_related('category', 'project')
    
    
    start_date, end_date = get_start_end_date(month, year)

    transactions = await query.all()
    
    transactions = [transaction for transaction in transactions if start_date <= transaction.date <= end_date]

    for transaction in transactions:
        transaction.amount = await convert_currency(transaction.amount, transaction.currency, cur)

    return {
        "month": month,
        "year": year,
        "cur": cur,
        'transactions' : transactions
    }

async def get_report_expense_by_category(user: User, month: Optional[str], year: str, cur: str, project_id: str) -> dict:
    query = None
    if project_id == "all":
        query = Transaction.filter(user=user).prefetch_related('category')
    else:
        query = Transaction.filter(user=user, project=int(project_id)).prefetch_related('category')
    
    start_date, end_date = get_start_end_date(month, year)

    transactions = await query.all()
    
    transactions = [transaction for transaction in transactions if start_date <= transaction.date <= end_date]
    expense_by_category = defaultdict(Decimal)


    for transaction in transactions:
        transaction.amount = await convert_currency(transaction.amount, transaction.currency, cur)
        if transaction.type == 'Expense':
            expense_by_category[transaction.category.name] += transaction.amount


    return {
        'expense_by_category': dict(expense_by_category),
    }


async def get_report_transactions(user: User, month: Optional[str], year: str, project_id: str) -> dict:
    query = None
    if project_id == "all":
        query = Transaction.filter(user=user).prefetch_related('category', 'project')
    else:
        query = Transaction.filter(user=user, project=int(project_id)).prefetch_related('category', 'project')
    
    start_date, end_date = get_start_end_date(month, year)

    transactions = await query.all()
    
    transactions = [transaction for transaction in transactions if start_date <= transaction.date <= end_date]

    return {
        'transactions': transactions,
    }