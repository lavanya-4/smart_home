# Smart Home Management API - Backend Setup

A FastAPI-based REST API for managing smart home devices, houses, alerts, and users with AWS DynamoDB as the database.

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- AWS Account with DynamoDB access
- AWS CLI configured (optional but recommended)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
cd /Users/rishisaginala/Downloads/ai_agents/smart_home/backend
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Edit `.env` and update the following values:

```env
# Security Settings - IMPORTANT!
SECRET_KEY="your-secret-key-here"  # Generate with: openssl rand -hex 32

# AWS Credentials
AWS_REGION="us-east-1"  # Your AWS region
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"

# CORS Settings
CORS_ORIGINS="*" 
```

**Generate a secure SECRET_KEY:**
```bash
openssl rand -hex 32
```

### 5. Set Up AWS DynamoDB Tables

The application requires the following DynamoDB tables:

- **Users** - User accounts and authentication
- **Houses** - House information
- **Devices** - Smart home devices
- **Alerts** - System alerts and notifications

#### Option A: Using AWS Console
1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb)
2. Create the following tables with their respective partition keys:
   - `Users` - Partition key: `user_id` (String)
   - `Houses` - Partition key: `house_id` (String)
   - `Devices` - Partition key: `device_id` (String)
   - `Alerts` - Partition key: `alert_id` (String)

#### Option B: Using AWS CLI
```bash
# Create Users table
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=user_id,AttributeType=S \
    --key-schema AttributeName=user_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create Houses table
aws dynamodb create-table \
    --table-name Houses \
    --attribute-definitions AttributeName=house_id,AttributeType=S \
    --key-schema AttributeName=house_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create Devices table
aws dynamodb create-table \
    --table-name Devices \
    --attribute-definitions AttributeName=device_id,AttributeType=S \
    --key-schema AttributeName=device_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create Alerts table
aws dynamodb create-table \
    --table-name Alerts \
    --attribute-definitions AttributeName=alert_id,AttributeType=S \
    --key-schema AttributeName=alert_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

### 6. Run the Application

```bash
# Make sure virtual environment is activated
python main.py

# Or use uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📁 Project Structure

```
backend/
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (not in git)
├── .env.example           # Environment template
├── core/
│   ├── config.py          # Configuration settings
│   ├── database.py        # DynamoDB connection
│   ├── dependencies.py    # FastAPI dependencies
│   └── error_handlers.py  # Error handling
├── models/
│   ├── user.py           # User data models
│   ├── house.py          # House data models
│   ├── device.py         # Device data models
│   ├── alert.py          # Alert data models
│   └── common.py         # Common/shared models
└── routes/
    ├── user_routes.py    # User endpoints
    ├── house_routes.py   # House endpoints
    ├── device_routes.py  # Device endpoints
    └── alert_routes.py   # Alert endpoints
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application name | "Smart Home Management API" | No |
| `APP_VERSION` | API version | "1.0.0" | No |
| `API_PREFIX` | API route prefix | "/api/v1" | No |
| `HOST` | Server host | "0.0.0.0" | No |
| `PORT` | Server port | 8000 | No |
| `RELOAD` | Auto-reload on changes | true | No |
| `SECRET_KEY` | JWT secret key | - | **Yes** |
| `ALGORITHM` | JWT algorithm | "HS256" | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | 30 | No |
| `AWS_REGION` | AWS region | "us-east-1" | **Yes** |
| `AWS_ACCESS_KEY_ID` | AWS access key | - | **Yes** |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - | **Yes** |
| `DYNAMODB_ENDPOINT_URL` | DynamoDB endpoint (for local) | None | No |
| `CORS_ORIGINS` | Allowed CORS origins | "*" | No |

### Local Development with DynamoDB Local

For local development without AWS, you can use DynamoDB Local:

```bash
# Download and run DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Update .env
DYNAMODB_ENDPOINT_URL="http://localhost:8000"
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### API Documentation
Visit http://localhost:8000/docs to explore all available endpoints interactively.

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/token` - Get access token

### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

### Houses
- `GET /api/v1/houses` - List all houses
- `POST /api/v1/houses` - Create house
- `GET /api/v1/houses/{house_id}` - Get house by ID
- `PUT /api/v1/houses/{house_id}` - Update house
- `DELETE /api/v1/houses/{house_id}` - Delete house

### Devices
- `GET /api/v1/devices` - List all devices
- `POST /api/v1/devices` - Create device
- `GET /api/v1/devices/{device_id}` - Get device by ID
- `PUT /api/v1/devices/{device_id}` - Update device
- `DELETE /api/v1/devices/{device_id}` - Delete device

### Alerts
- `GET /api/v1/alerts` - List all alerts
- `POST /api/v1/alerts` - Create alert
- `GET /api/v1/alerts/{alert_id}` - Get alert by ID
- `PUT /api/v1/alerts/{alert_id}` - Update alert
- `DELETE /api/v1/alerts/{alert_id}` - Delete alert

## 🔒 Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Token expiration after 30 minutes (configurable)
- CORS protection
- Environment variables for sensitive data

## 🐛 Troubleshooting

### Virtual Environment Issues
```bash
# Deactivate and recreate
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### AWS Credentials Error
```bash
# Verify AWS credentials
aws configure list
aws dynamodb list-tables
```

### Port Already in Use
```bash
# Change port in .env
PORT=8001

# Or kill the process
lsof -ti:8000 | xargs kill -9
```

### DynamoDB Connection Error
- Verify AWS credentials are correct
- Check if DynamoDB tables exist in your region
- Ensure IAM user has DynamoDB permissions

## 📦 Dependencies

- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Boto3** - AWS SDK for Python
- **Python-JOSE** - JWT implementation
- **Passlib** - Password hashing
- **Python-dotenv** - Environment variable management


## 📄 License

This project is for educational/demonstration purposes.

## 📧 Support

For issues or questions, please check the API documentation at `/docs` or contact the development team.
