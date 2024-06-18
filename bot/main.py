import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import CommandStart
import config as cfg

bot = Bot(token=cfg.bot_token)

def startBOT(dp: Dispatcher):
    @dp.message(CommandStart())
    async def start(message: types.Message):
        # ikb_donate = InlineKeyboardMarkup(row_width=1,
        #                                 inline_keyboard=[
        #                                     [
        #                                         InlineKeyboardButton(text='Web app', web_app=WebAppInfo(url=f'https://mikebot-frontend-react-coral.vercel.app/'))
        #                                     ],
        #                                     [
        #                                         InlineKeyboardButton(text='How to play?',  callback_data='how_to_play')
        #                                     ],
        #                                     [
        #                                         InlineKeyboardButton(text='How to make money from the game?',  callback_data='How_to_make_money')
        #                                     ]
        #                                 ])

        await message.answer('👋 Hi *Artem*! Welcome to Bingo\n\nClick on the play button to open the game', parse_mode="Markdown")
