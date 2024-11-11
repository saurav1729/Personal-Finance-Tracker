# Use an official Node runtime as a parent image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies with --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy the rest of your application
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
