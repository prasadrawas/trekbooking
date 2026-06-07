# Razorpay Test Payment Details

Use these credentials in **Test Mode** only. No real money is charged.

## Cards

| Card Type | Number | Expiry | CVV |
|---|---|---|---|
| Mastercard (Domestic) | `5267 3181 8797 5449` | `12/28` | `123` |
| Visa (Domestic) | `4111 1111 1111 1111` | `12/28` | `123` |

> For international cards, use Visa. For Indian cards, use Mastercard.

## UPI

| UPI ID | Result |
|---|---|
| `success@razorpay` | Payment succeeds |
| `failure@razorpay` | Payment fails |

## Netbanking

Select any bank — all auto-succeed in test mode.

## Wallets

Select any wallet — all auto-succeed in test mode.

## OTP

When prompted for OTP during card payment, enter any number (e.g., `123456`).

## Notes

- These credentials only work with `rzp_test_*` API keys
- Switch to `rzp_live_*` keys for real payments (requires Razorpay KYC)
- Razorpay dashboard: https://dashboard.razorpay.com
