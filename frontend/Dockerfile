# Production Frontend - Static Files with Nginx (SMP_Novels)
FROM nginx:alpine

# Copy static files directly (no build step needed for vanilla JS)
COPY index.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app &&     chown -R app:app /app

USER app

# Expose port
EXPOSE 80

# Use tini for proper PID 1 handling and signal forwarding
ENTRYPOINT ["/sbin/tini", "--"]

# Serve static files with Nginx (no need for Node.js HTTP server)
CMD ["nginx", "-g", "daemon off;"]
