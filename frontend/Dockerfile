# Production Frontend - Static Files with Nginx
FROM nginx:alpine

# Copy static files directly (no build step needed for vanilla JS)
COPY index.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
