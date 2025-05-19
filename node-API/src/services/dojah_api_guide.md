# Dojah API Integration Guide

## Verify NIN with Selfie Image

Lookup and verify users' NIN with their selfie image.

### Important Information About vNIN

* The NIN holder can generate their virtual NIN via the NIMC Mobile App or the NIMC USSD code - `*346*3*NIN*EnterpriseCode#`.
* Dojah's Enterprise code: `1138183`
* The generated VNIN is valid for only 72 hours.
* The vNIN is designed to replace the 11-digit NIN for everyday usage. It is a unique 16-character alphanumeric token comprising 12 digits, sandwiched between 4 alphabets, two on each end, with no correlation to the issuer's Raw NIN. An example of a vNIN is: `AB012345678910YZ`.
* According to NIMC, The VNIN is not to be stored in any database but only used for verifying the NIN holder.

### Request

**Method:** `POST`

**Endpoint:** `{{baseUrl}}/api/v1/kyc/vnin/verify`

### Headers

| Header        | Type   | Description                                                                      |
| ------------- | ------ | -------------------------------------------------------------------------------- |
| AppId         | string | Create an app to get your app ID on dashboard [here](https://dojah.io/dashboard) |
| Authorization | string | Public secret key                                                                |

### Body Parameters

| Parameter     | Type   | Description                      | Required |
| ------------- | ------ | -------------------------------- | -------- |
| vnin          | string | A uniquely generated virtual NIN | Required |
| selfie\_image | string | Base64 value of the selfie image | Required |

### Request

**Method:** `POST`

**Endpoint:** `{{baseUrl}}/api/v1/kyc/nin/verify`

### Headers

| Header        | Type   | Description                                                                      |
| ------------- | ------ | -------------------------------------------------------------------------------- |
| AppId         | string | Create an app to get your app ID on dashboard [here](https://dojah.io/dashboard) |
| Authorization | string | Public secret key                                                                |

### Body Parameters

| Parameter     | Type   | Description                                                                  | Required |
| ------------- | ------ | ---------------------------------------------------------------------------- | -------- |
| last\_name    | string | Last Name                                                                    | Optional |
| first\_name   | string | First Name                                                                   | Optional |
| selfie\_image | string | Base64 value of the selfie image. Truncate `data:image/jpeg;base64,` prefix. | Required |
| nin           | string | National Identity Verification Number                                        | Required |

### Sample Response

```json
{
    "entity": {
         "first_name": "John",
         "last_name": "Doe",
         "middle_name": "Chinwe",
         "gender": "M",
         "image": "/9j/4AAQScXJSgBBAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwg...",
         "phone_number": "0812345678",
         "date_of_birth": "1993-05-06",
         "nin": "70123456789",
         "selfie_verification": {
             "confidence_value": 99.90354919433594,
             "match": true
         }
    }
}
```

### Test Credentials for Sandbox

Kindly use this Test NIN in sandbox Environment:

```
nin = 70123456789
```

## Verify BVN with Selfie Image

Lookup and verify users' BVN with their selfie image.

### Request

**Method:** `POST`

**Endpoint:** `{{baseUrl}}/api/v1/kyc/bvn/verify`

### Headers

| Header        | Type   | Description                                                                      |
| ------------- | ------ | -------------------------------------------------------------------------------- |
| AppId         | string | Create an app to get your app ID on dashboard [here](https://dojah.io/dashboard) |
| Authorization | string | Public secret key                                                                |

### Body Parameters

| Parameter     | Type   | Description                                                                  | Required |
| ------------- | ------ | ---------------------------------------------------------------------------- | -------- |
| selfie\_image | string | Base64 value of the selfie image. Truncate `data:image/jpeg;base64,` prefix. | Required |
| bvn           | string | A Valid BVN Number                                                           | Required |

### Sample Response

```json
{
    "entity": {
        "bvn": "1234567890",
        "first_name": "JOHN",
        "middle_name": "ANON",
        "last_name": "DOE",
        "date_of_birth": "01-January-1907",
        "phone_number1": "08103817187",
        "gender": "Male",
        "selfie_verification": {
            "confidence_value": 99.99620056152344,
            "match": true
        }
    }
}
```

### Test Credentials for Sandbox

Kindly use this Test BVN in sandbox Environment:

```
bvn = 22222222222
```
