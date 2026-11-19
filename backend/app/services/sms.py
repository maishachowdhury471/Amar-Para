"""SMS provider — ইন্টারফেস + ডেভ লগ প্রোভাইডার + আসল provider-এর স্টাব।

আসল SMS (যেমন BulkSMSBD / SSL Wireless / Twilio) লাগাতে EnvSmsProvider-এর
_send() মেথডে provider-এর HTTP API কল বসাতে হবে — কনফিগ .env-এ:
SMS_PROVIDER, SMS_API_KEY, SMS_API_URL, SMS_SENDER_ID।
"""

import logging
from typing import Protocol

import httpx

from ..config import get_settings

logger = logging.getLogger("amarpara.sms")


class SmsProvider(Protocol):
    def send_otp(self, mobile: str, otp: str) -> bool:
        """OTP SMS পাঠাও। সফল হলে True।"""
        ...


class LogSmsProvider:
    """ডেভ প্রোভাইডার — SMS না পাঠিয়ে কনসোলে লগ করে।"""

    def send_otp(self, mobile: str, otp: str) -> bool:
        logger.info("DEV SMS to %s: OTP=%s", mobile, otp)
        print(f"[DEV SMS] {mobile} -> OTP: {otp}")
        return True


class EnvSmsProvider:
    """আসল SMS provider-এর স্টাব — .env-এর API URL-এ POST করে।

    provider-ভেদে পেলোড আলাদা হয়; নিচের ফরম্যাটটি সাধারণ JSON ফরম্যাট।
    আসল provider যুক্ত করার সময় এই ক্লাসের _send() ঠিক করুন।
    """

    def __init__(self) -> None:
        s = get_settings()
        self.api_url = s.sms_api_url
        self.api_key = s.sms_api_key
        self.sender_id = s.sms_sender_id

    def send_otp(self, mobile: str, otp: str) -> bool:
        if not self.api_url or not self.api_key:
            logger.warning("SMS_API_URL/API_KEY সেট করা নেই — SMS পাঠানো যায়নি (%s)", mobile)
            return False
        message = f"Amar Para OTP: {otp}. ১০ মিনিটের মধ্যে ব্যবহার করুন।"
        try:
            resp = httpx.post(
                self.api_url,
                json={"api_key": self.api_key, "sender_id": self.sender_id, "to": mobile, "message": message},
                timeout=15,
            )
            resp.raise_for_status()
            return True
        except Exception as exc:  # noqa: BLE001 — SMS ব্যর্থতা লগ করে False ফেরত
            logger.error("SMS পাঠাতে ব্যর্থ (%s): %s", mobile, exc)
            return False


def get_sms_provider() -> SmsProvider:
    if get_settings().sms_provider.lower() == "env":
        return EnvSmsProvider()
    return LogSmsProvider()
