from fastapi import (
    FastAPI, 
    Depends, 
    HTTPException, 
    status, 
    Form,
    Request, 
    Query
)
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.exceptions import ValidationException
from tortoise.contrib.fastapi import register_tortoise
from datetime import timedelta, datetime
from typing import List
from schemas import (
    UserResetPass,
    UserCreate,
    UserUpdate,
    User as UserSchema,
    UserProfile,
    Token,
    TokenData,
    TransactionCreate,
    TransactionUpdate,
    Transaction as TransactionSchema,
    CategoryCreate,
    Overview,
    ReportExVSIn,
    ReportExbyCat,
    TransactionReport
)
from crud import (
    create_user,
    get_user_by_email,
    update_user,
    update_transaction as update_transaction_crud,
    create_transaction as create_transaction_crud,
    get_transactions,
    delete_transaction as delete_transaction_crud,
    get_filtered_transactions,
    get_report_transactions as get_report_transactions_crud,
    get_report_expense_by_category as get_report_expense_by_category_crud,
    get_report_expense_vs_income as get_report_expense_vs_income_crud
)
from auth import (
    hash_password,
    verify_password,
    get_current_active_user,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    get_user_by_email

)
import models
from typing import Optional
import database
from fastapi.middleware.cors import CORSMiddleware
from currency import fetch_exchange_rates, read_exchange_rates, convert_currency
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from auth import get_user
from typing import Callable
from config_orm import TORTOISE_ORM

app = FastAPI()


class UserMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        token = request.cookies.get("Authorization")
        if token:
            try:
                user = await get_user(token)
                request.state.user = user
            except Exception as e:
                request.state.user = None
        else:
            request.state.user = None
        
        response = await call_next(request)
        return response

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
app.add_middleware(UserMiddleware)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

register_tortoise(
    app,
    db_url=TORTOISE_ORM["connections"]["default"],
    modules={"models": ["models"]},
    generate_schemas=True,
    add_exception_handlers=True,
)

@app.on_event("startup")
async def startup():
    await database.init()

    # Fetch initial exchange rates
    # await fetch_exchange_rates()

    # Start background task for periodic updates
    # asyncio.create_task(update_exchange_rates_periodically()) #will uncomment when exchange rate subscription refill

async def update_exchange_rates_periodically():
    while True:
        await fetch_exchange_rates()
        await asyncio.sleep(60 * 30)  # Update every 30 min

@app.get("/exchange-rates/{cur}")
async def get_exchange_rates(cur: str):
    rates = await read_exchange_rates(cur)
    return JSONResponse(content=rates)

@app.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    user_db = await get_user_by_email(user.email)
    if user_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if user.password != user.password2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    
    user = await create_user(user.username, user.email, user.password)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.put("/update-settings", response_model=Token)
async def update_current_user(
    user_update: UserUpdate, current_user: UserSchema = Depends(get_current_active_user)
):
    user = await update_user(current_user, user_update)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.put("/reset-password", response_model=UserSchema)
async def reset_password(
    user_reset: UserResetPass,
    current_user: UserSchema = Depends(get_current_active_user),
):
    user = await models.User.get(id=current_user.id)
    if not verify_password(user_reset.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if user_reset.password != user_reset.password2:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    user.hashed_password = hash_password(user_reset.password)
    await user.save()
    return user


@app.get("/users/me/", response_model= UserProfile)
async def read_users_me(current_user: UserSchema = Depends(get_current_active_user)):
    return current_user

@app.get("/", response_class=HTMLResponse)
async def read_root():
    return templates.TemplateResponse("index.html", {"request": {}})

@app.get("/signup", response_class=HTMLResponse)
async def get_signup():
    return templates.TemplateResponse("signup.html", {"request": {}})

@app.get("/login", response_class=HTMLResponse)
async def get_login():
    return templates.TemplateResponse("login.html", {"request": {}})

@app.get("/profile", response_class=HTMLResponse)
async def get_profile(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})

@app.get("/logout", response_class=HTMLResponse)
async def logout():
    response = RedirectResponse(url="/login")
    response.delete_cookie("Authorization")
    return response



# @app.post("/categories/", response_model=CategoryCreate)
# async def create_category_endpoint(
#     category: CategoryCreate, current_user: UserSchema = Depends(get_current_active_user)
# ):
#     return await create_category(current_user, category.name)



@app.post("/transactions/", response_model=TransactionSchema)
async def create_transaction(transaction: TransactionCreate, current_user: UserSchema = Depends(get_current_active_user)):
    return await create_transaction_crud(current_user, transaction)

@app.get("/transactions/", response_model=List[TransactionSchema])
async def read_transactions(current_user: UserSchema = Depends(get_current_active_user)):
    return await get_transactions(current_user)

# Update transaction endpoint
@app.put("/transactions/{transaction_id}", response_model=TransactionSchema)
async def update_transaction(transaction_id: int, transaction: TransactionUpdate, current_user: UserSchema = Depends(get_current_active_user)):
    updated_transaction = await update_transaction_crud(current_user, transaction_id, transaction)
    if updated_transaction:
        return updated_transaction
    raise HTTPException(status_code=404, detail=f"Transaction with id {transaction_id} not found")

# Delete transaction endpoint
@app.delete("/transactions/{transaction_id}", response_model=dict)
async def delete_transaction(transaction_id: int, current_user: UserSchema = Depends(get_current_active_user)):
    deleted = await delete_transaction_crud(current_user, transaction_id)
    if deleted:
        return {"message": "Transaction deleted"}
    raise HTTPException(status_code=404, detail=f"Transaction with id {transaction_id} not found")


@app.get("/transactions", response_class=HTMLResponse)
async def get_transactions_page(request: Request):
    user = request.state.user
    projects = await models.Project.filter(user=user)
    return templates.TemplateResponse("transactions.html", {"request": request, "projects":projects})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    user = request.state.user
    projects = await models.Project.filter(user=user)
    return templates.TemplateResponse("dashboard.html", {"request": request, "projects":projects})


@app.get("/dashboard/data", response_model=Overview)
async def get_dashboard_data(
    month: Optional[str] = Query(None, description="Month (e.g., '7' for July, 'all' for all months)"),
    year: str = Query(..., description="Year (e.g., '2024')"),
    cur: str = Query(..., description="Currency (e.g., 'USD')"),
    project_id: str = Query(..., description="Project ID (e.g., '3'.. or 'all' for all projects)"),
    current_user: UserSchema = Depends(get_current_active_user)):

    overview_data = await get_filtered_transactions(current_user, str(month), str(year), cur, str(project_id))
    return Overview(**overview_data)


@app.get("/reports/expense-vs-income/data", response_model=ReportExVSIn)
async def get_report_expense_vs_income(
    month: Optional[str] = Query(None, description="Month (e.g., '7' for July, 'all' for all months)"),
    year: str = Query(..., description="Year (e.g., '2024')"),
    cur: str = Query(..., description="Currency (e.g., 'USD')"),
    project_id: str = Query(..., description="Project ID (e.g., '3'.. or 'all' for all projects)"),
    current_user: UserSchema = Depends(get_current_active_user)):

    overview_data = await get_report_expense_vs_income_crud(current_user, str(month), str(year), str(cur), str(project_id))
    return ReportExVSIn(**overview_data)


@app.get("/reports/expense-by-category/data", response_model=ReportExbyCat)
async def get_report_expense_by_category(
    month: Optional[str] = Query(None, description="Month (e.g., '7' for July, 'all' for all months)"),
    year: str = Query(..., description="Year (e.g., '2024')"),
    cur: str = Query(..., description="Currency (e.g., 'USD')"),
    project_id: str = Query(..., description="Project ID (e.g., 3.. or 'all' for all projects)"),
    current_user: UserSchema = Depends(get_current_active_user)):

    overview_data = await get_report_expense_by_category_crud(current_user, str(month), str(year), str(cur), str(project_id))
    return ReportExbyCat(**overview_data)


@app.get("/reports/transactions/data", response_model=TransactionReport)
async def get_report_transactions(
    month: Optional[str] = Query(None, description="Month (e.g., '7' for July, 'all' for all months)"),
    year: str = Query(..., description="Year (e.g., '2024')"),
    project_id: str = Query(..., description="Project ID (e.g., 3.. or 'all' for all projects)"),
    current_user: UserSchema = Depends(get_current_active_user)):

    overview_data = await get_report_transactions_crud(current_user, str(month), str(year), str(project_id))
    return TransactionReport(**overview_data)


@app.get("/reports/transactions", response_class=HTMLResponse)
async def get_transaction_report_page(request: Request):
    user = request.state.user
    projects = await models.Project.filter(user=user)
    return templates.TemplateResponse("report_transactions.html", {"request": request, "projects":projects})

@app.get("/reports/income-vs-expense", response_class=HTMLResponse)
async def get_invsex_page(request: Request):
    user = request.state.user
    projects = await models.Project.filter(user=user)
    return templates.TemplateResponse("report_income_expense.html", {"request": request, "projects":projects})


@app.get("/reports/expense-by-category", response_class=HTMLResponse)
async def get_exbycat_page(request: Request):
    user = request.state.user
    projects = await models.Project.filter(user=user)
    return templates.TemplateResponse("report_expense_by_category.html", {"request": request, "projects":projects})


@app.get("/settings", response_class=HTMLResponse)
async def get_settings_page(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request})

@app.get("/admin-panel", response_class=HTMLResponse)
async def get_admin_panel(request: Request):
    current_user = request.state.user
    if not current_user or not current_user.is_superuser:
        raise HTTPException(status_code=401, detail="Unauthorized")
    transactions = await models.Transaction.all().prefetch_related('category', 'user')
    users = await models.User.all()
    categories = await models.Category.all()
    return templates.TemplateResponse("admin_panel.html", {
        "request":request,
        "transactions":transactions,
        "users":users,
        "categories":categories
        })

