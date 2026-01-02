<<<<<<< HEAD
# SQA Management System

AI-Powered Software Quality Assurance Management System with React Frontend and FastAPI Backend.

## 🚀 Features

- **Code Analysis Agent**: Static code review with security and quality checks
- **Requirement Agent**: Requirement quality validation with LLM-powered analysis
- **Test Generation Agent**: Automated test case generation from code
- **Modern UI**: React + TypeScript + Tailwind CSS
- **Secure Authentication**: JWT-based auth with bcrypt password hashing

## 📁 Project Structure

```
SQA-Management-System/
├── backend/                    # FastAPI Backend
│   ├── agents/                 # AI Agents
│   │   ├── code_agent/         # Code review & analysis
│   │   ├── requirement_agent/  # Requirement validation
│   │   ├── test_agent/         # Test generation
│   ├── api/                    # API Routes
│   ├── config/                 # Configuration
│   ├── database/               # Database models & connection
│   ├── utils/                  # Utilities (JWT, LLM, etc.)
│   ├── main.py                 # FastAPI entry point
│   └── requirements.txt        # Python dependencies
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   ├── context/            # State management
│   │   └── styles/             # Global styles
│   ├── package.json
│   └── vite.config.ts
└── deployment/                 # Azure deployment files
```

## 🛠️ Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Azure OpenAI API access (or OpenAI API)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux

# Edit .env with your settings (especially Azure OpenAI keys)

# Run the server
python main.py
```

Backend will be running at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (optional, uses proxy in dev)
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux

# Run development server
npm run dev
```

Frontend will be running at: http://localhost:5173

## 🔧 Environment Variables

### Backend (.env)

```env
# App Settings
DEBUG=true
SECRET_KEY=your-secret-key-minimum-32-characters-long

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-minimum-32-characters
JWT_EXPIRATION_HOURS=24

# Azure SQL (leave empty for local SQLite)
AZURE_SQL_SERVER=
AZURE_SQL_DATABASE=
AZURE_SQL_USERNAME=
AZURE_SQL_PASSWORD=

# Azure OpenAI (REQUIRED)
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/v1
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### Frontend (.env)

```env
# Leave empty for development (uses Vite proxy)
VITE_API_URL=
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Agents
- `POST /api/agents/code/analyze` - Analyze code
- `POST /api/agents/code/analyze-file` - Analyze uploaded file
- `POST /api/agents/requirement/validate` - Validate requirement
- `POST /api/agents/requirement/extract` - Extract requirements from file
- `POST /api/agents/test/generate` - Generate test cases
- `GET /api/agents/history` - Get execution history


## 🚢 Azure Deployment

### 1. Create Azure Resources

```bash
# Login to Azure
az login

# Create Resource Group
az group create --name sqa-rg --location eastus

# Create Azure SQL Database
az sql server create --name sqa-sql-server --resource-group sqa-rg --admin-user sqladmin --admin-password YourSecurePassword123!
az sql db create --resource-group sqa-rg --server sqa-sql-server --name sqa-database --service-objective S0

# Create App Service Plan
az appservice plan create --name sqa-plan --resource-group sqa-rg --sku B1 --is-linux

# Create Backend App Service
az webapp create --resource-group sqa-rg --plan sqa-plan --name sqa-backend-app --runtime "PYTHON:3.11"

# Create Frontend App Service
az webapp create --resource-group sqa-rg --plan sqa-plan --name sqa-frontend-app --runtime "NODE:20-lts"
```

### 2. Configure App Settings

```bash
# Set Backend environment variables
az webapp config appsettings set --resource-group sqa-rg --name sqa-backend-app --settings \
    AZURE_OPENAI_API_KEY="your-key" \
    AZURE_OPENAI_ENDPOINT="your-endpoint" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4" \
    AZURE_SQL_SERVER="sqa-sql-server.database.windows.net" \
    AZURE_SQL_DATABASE="sqa-database" \
    AZURE_SQL_USERNAME="sqladmin" \
    AZURE_SQL_PASSWORD="YourSecurePassword123!" \
    JWT_SECRET_KEY="your-jwt-secret" \
    SECRET_KEY="your-secret-key"

# Set Frontend environment variables
az webapp config appsettings set --resource-group sqa-rg --name sqa-frontend-app --settings \
    VITE_API_URL="https://sqa-backend-app.azurewebsites.net/api"
```

### 3. Deploy using Azure DevOps

1. Create a new Azure DevOps project
2. Create a service connection to your Azure subscription
3. Update `deployment/azure-pipelines.yml` with your settings
4. Create a new pipeline using the YAML file
5. Run the pipeline

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
=======
# Introduction 
TODO: Give a short introduction of your project. Let this section explain the objectives or the motivation behind this project. 

# Getting Started
TODO: Guide users through getting your code up and running on their own system. In this section you can talk about:
1.	Installation process
2.	Software dependencies
3.	Latest releases
4.	API references

# Build and Test
TODO: Describe and show how to build your code and run the tests. 

# Contribute
TODO: Explain how other users and developers can contribute to make your code better. 

If you want to learn more about creating good readme files then refer the following [guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). You can also seek inspiration from the below readme files:
- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)
>>>>>>> cfa13de44ff5d42526605e251dbc4cd48d3b15fa
