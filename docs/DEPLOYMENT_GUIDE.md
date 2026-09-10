# Deployment Guide - AgriMind AI Production Release

This guide outlines the production deployment strategy for AgriMind AI on cloud platforms (AWS / Azure) using Docker containers.

---

## 1. Production Architecture Overview

A secure, highly scalable production deployment leverages:
- **Application Load Balancer (ALB):** Terminating TLS 1.3 and routing requests.
- **ECS (Fargate) / Kubernetes (AKS):** Hosting API backend and frontend client pods.
- **RDS PostgreSQL (with TimescaleDB extension):** Relational transactional database.
- **ElastiCache Redis:** Session caching, weather caching, and rate limiting.
- **AWS S3 / Azure Blob Storage:** Storing user images, leaf scans, and generated PDFs.
- **Nginx Container:** Reversing proxy and serving static headers.

---

## 2. Pre-Deployment Configuration

### 2.1 Environmental Variables
Secure your production environment by setting the following parameters in your cloud instance configs (do not push these keys to git):
```env
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=highly-secure-32-character-random-secret-key
DATABASE_URL=postgresql+asyncpg://prod_user:strong_password@rds-endpoint:5432/agrimind_db
REDIS_URL=redis://elasticache-redis-endpoint:6379/0
STORAGE_TYPE=s3
S3_BUCKET=agrimind-production-assets
S3_ACCESS_KEY=your-iam-access-key
S3_SECRET_KEY=your-iam-secret-key
OPENWEATHERMAP_API_KEY=your-openweathermap-key
```

---

## 3. Deployment Steps (AWS ECS Fargate)

### Step 1: Create Container Repositories (ECR)
Create two private repositories in AWS ECR to store your Docker images:
```bash
aws ecr create-repository --repository-name agrimind-backend
aws ecr create-repository --repository-name agrimind-frontend
```

### Step 2: Build and Push Docker Images
Tag and push your local Docker containers to AWS ECR:
```bash
# Authenticate ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Backend
docker build -t agrimind-backend -f backend/Dockerfile ./backend
docker tag agrimind-backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/agrimind-backend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/agrimind-backend:latest

# Frontend
docker build -t agrimind-frontend -f frontend/Dockerfile ./frontend
docker tag agrimind-frontend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/agrimind-frontend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/agrimind-frontend:latest
```

### Step 3: Provision RDS PostgreSQL and ElastiCache
1. Boot a Multi-AZ RDS PostgreSQL instance (PostgreSQL 15+).
2. Configure security groups to allow traffic only from the ECS task security groups on port 5432.
3. Provision an ElastiCache Redis cluster.

### Step 4: Configure ECS Task Definitions
Create a task definition in AWS ECS combining your containers:
- **Backend Service:** Allocate 1 vCPU and 2GB RAM. Map port 8000. Add environmental variables for DB and Redis endpoints.
- **Frontend Service:** Allocate 0.5 vCPU and 1GB RAM. Map port 3000. Set `NEXT_PUBLIC_API_URL` to your backend subdomain (e.g., `https://api.agrimind.ai`).

### Step 5: Setup Load Balancer & SSL
1. Create an Application Load Balancer (ALB).
2. Register target groups for backend (port 8000) and frontend (port 3000).
3. Obtain an SSL certificate using AWS Certificate Manager (ACM).
4. Configure HTTPS (port 443) listeners on the ALB with rule routing:
   - Path `/api/*` -> Backend Target Group.
   - Path `/ws/*` -> Backend Target Group (enable WebSockets support).
   - Default rule -> Frontend Target Group.

### Step 6: Deploy Services & Run Migrations
Run your active task definition on the ECS cluster. Execute the database migration step as a one-off ECS task before launching services:
```bash
docker run -e DATABASE_URL=postgresql+asyncpg://... agrimind-backend:latest alembic upgrade head
```
