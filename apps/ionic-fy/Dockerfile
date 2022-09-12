# # Option 1: Manually build and copy angular app to nginx docker 

FROM nginx:alpine

COPY apps/ionic-fy/www /usr/share/nginx/html

COPY nginx.config /etc/nginx/conf.d/default.conf

EXPOSE 80

# # Option 2: Auto build and create docker image (for github action)
# ## Stage 1: Build the angular app
# FROM node:14 as build
# # Set the working directory
# WORKDIR /usr/local/app
# # Copy package.json related file for building node_modules
# COPY package.json patch.js ./
# # Install Angular CLI
# RUN npm install -g @angular/cli

# # Add the source code to app
# COPY . .
# # Install all the dependencies
# RUN npm install --unsafe-perm
# # Start building node app
# RUN npm run build.ionic.fy.prod

# # Stage 2: Serve app with nginx server
# # Use official nginx image as the base image
# FROM nginx:alpine
# # Copy the above build output to replace the default nginx contents.
# COPY --from=build /usr/local/app/apps/ionic-fy/www /usr/share/nginx/html
# # Copy custom nginx config
# COPY nginx.config /etc/nginx/conf.d/default.conf
# # Expose port 80
# EXPOSE 80
