# Financial Tracker Application

![screencapture-financy-teys-onrender-dashboard-2024-07-23-01_19_28](https://github.com/user-attachments/assets/5b4d137d-eadc-4dc3-adc9-4d0516f6f171)


## Project Overview

This is a comprehensive financial tracker application designed to help users manage their finances efficiently. Built using FastAPI, the application provides a modern, fast, and asynchronous web framework. The database operations are handled using Tortoise-ORM, a native and easy-to-use Object Relational Mapper. This application allows users to categorize and monitor their income and expenses across different projects, making it easy to track financial progress and make informed decisions, and getting reports based on their needs.

Key features of the application include:
- User authentication and authorization.
- Project and category management.
- CRUD operations for transactions, allowing users to create, read, update, and delete their financial records.
- Nice Graphs for visualizing the transactions.
- Swagger UI documentation for easy API testing and exploration.

Technologies used in this project:
- **FastAPI**: For building the web API.
- **Tortoise-ORM**: For ORM and database interactions.
- **PostgreSQL**: As the relational database.
- **Pydantic**: For data validation.
- **Aerich**: For database migrations.
- **HTML/CSS/JavaScript**: For the frontend interface.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/munjed-ab/finance.git
    ```

2. Create and activate a virtual environment:

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3. Install the dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4. Set up the database:

    ```bash
    aerich init -t config_orm.TORTOISE_ORM
    aerich init-db
    aerich migrate
    aerich upgrade
    ```

5. Run the application:

    ```bash
    uvicorn main:app --reload
    ```

## Usage

1. Open your browser and go to `http://127.0.0.1:8000/docs` to access the automatically generated Swagger UI documentation.
2. Use the provided endpoints to manage users, projects, categories, and transactions.
3. Example endpoints include:
   - `POST /transactions/` to create a new transaction.
   - `GET /transactions/` to list all transactions.
   - `PUT /transactions/{transaction_id}` to update a transaction.
   - `DELETE /transactions/{transaction_id}` to delete a transaction.

## License

This project is licensed under the MIT License.
