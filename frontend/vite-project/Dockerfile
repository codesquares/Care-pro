# Multi-stage build for React frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_CONTENTFUL_SPACE_ID=qp3ctezw3mqr
ARG VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED=69pqIRURSVr7hMKbyUCkSg5HvHYbg3idZIs5o4EuJYA
ARG VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT=6drcdizoknhHdF__X_ZhA3kmRa2sXhpPhdiTBrq1h2I
ARG VITE_CONTENTFUL_ENVIRONMENT=master
ARG VITE_API_URL=https://carepro-api20241118153443.azurewebsites.net/api
ARG VITE_LOCAL_API_URL=https://care-pro-node-api.onrender.com/identity-api
ARG VITE_DOJAH_WIDGET_ID=68732f5e97202a07f66bc89a
ARG VITE_DOJAH_APP_ID=686c915878a2b53b2bdb5631
ARG VITE_DOJAH_PUBLIC_KEY=prod_pk_QTjK773OoJl6siRJFLNBUq07M

# Set environment variables from build args
ENV VITE_CONTENTFUL_SPACE_ID=$VITE_CONTENTFUL_SPACE_ID
ENV VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED=$VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED
ENV VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT=$VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT
ENV VITE_CONTENTFUL_ENVIRONMENT=$VITE_CONTENTFUL_ENVIRONMENT
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LOCAL_API_URL=$VITE_LOCAL_API_URL
ENV VITE_DOJAH_WIDGET_ID=$VITE_DOJAH_WIDGET_ID
ENV VITE_DOJAH_APP_ID=$VITE_DOJAH_APP_ID
ENV VITE_DOJAH_PUBLIC_KEY=$VITE_DOJAH_PUBLIC_KEY

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