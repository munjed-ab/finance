import os
from dotenv import load_dotenv

load_dotenv()

TORTOISE_ORM = {
    "connections": {
        "default": f"postgres://{os.environ['DP_USER']}:{os.environ['DP_PASS']}@{os.environ['DP_HOST']}:{os.environ['DP_PORT']}/{os.environ['DP_NAME']}"
    },
    "apps": {
        "models": {
            "models": ["models", "aerich.models"],
            "default_connection": "default",
        },
    },
}