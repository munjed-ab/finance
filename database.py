from tortoise import Tortoise, run_async
from config_orm import TORTOISE_ORM

async def init():
    await Tortoise.init(TORTOISE_ORM)
    await Tortoise.generate_schemas()

if __name__ == "__main__":
    run_async(init())
