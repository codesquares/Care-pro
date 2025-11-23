# Multi-stage build for React frontend
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Set npm configuration for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 3 && \
    npm config set registry https://registry.npmjs.org/

# Install dependencies with retries and better error handling
RUN for i in 1 2 3; do \
        npm install --legacy-peer-deps --no-audit --no-fund && break || \
        (echo "npm install attempt $i failed, retrying..." && sleep 10); \
    done && \
    npm cache clean --force

# Copy source code
COPY . .

# Build arguments for environment variables - VALUES MUST BE PROVIDED DURING BUILD
# SECURITY NOTE: No default values provided to prevent hardcoded secrets
ARG VITE_CONTENTFUL_SPACE_ID
ARG VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED
ARG VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT
ARG VITE_CONTENTFUL_ENVIRONMENT
ARG VITE_PRODUCTION_API_URL
ARG VITE_STAGING_API_URL
ARG VITE_LOCAL_API_URL
ARG VITE_DOJAH_WIDGET_ID
ARG VITE_DOJAH_APP_ID
ARG VITE_DOJAH_PUBLIC_KEY
ARG VITE_DEBUG
ARG VITE_REDIRECT_URL
ARG VITE_ENV

# Set environment variables from build args
ENV VITE_CONTENTFUL_SPACE_ID=$VITE_CONTENTFUL_SPACE_ID
ENV VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED=$VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED
ENV VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT=$VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT
ENV VITE_CONTENTFUL_ENVIRONMENT=$VITE_CONTENTFUL_ENVIRONMENT
ENV VITE_PRODUCTION_API_URL=$VITE_PRODUCTION_API_URL
ENV VITE_STAGING_API_URL=$VITE_STAGING_API_URL
ENV VITE_LOCAL_API_URL=$VITE_LOCAL_API_URL
ENV VITE_DOJAH_WIDGET_ID=$VITE_DOJAH_WIDGET_ID
ENV VITE_DOJAH_APP_ID=$VITE_DOJAH_APP_ID
ENV VITE_DOJAH_PUBLIC_KEY=$VITE_DOJAH_PUBLIC_KEY
ENV VITE_DEBUG=$VITE_DEBUG
ENV VITE_REDIRECT_URL=$VITE_REDIRECT_URL
ENV VITE_ENV=$VITE_ENV

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories and set permissions for non-root nginx
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

# Switch to nginx user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]