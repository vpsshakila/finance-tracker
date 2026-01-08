FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_GOOGLE_API_KEY
ARG VITE_SPREADSHEET_ID
ARG VITE_SHEET_NAME

# Set environment variables
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY
ENV VITE_SPREADSHEET_ID=$VITE_SPREADSHEET_ID
ENV VITE_SHEET_NAME=$VITE_SHEET_NAME

# Build app
RUN npm run build

# Install serve untuk production
RUN npm install -g serve

EXPOSE 4000

# Serve built files
CMD ["serve", "-s", "dist", "-l", "3000"]