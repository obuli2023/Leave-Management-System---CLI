# 1. Build the React Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /src
# Copy the frontend source code
COPY Frontend/ ./Frontend/
WORKDIR /src/Frontend
RUN npm install
# This build command natively outputs to ../Backend/wwwroot due to our vite.config.ts setup
RUN npm run build

# 2. Build the .NET Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build-backend
WORKDIR /src
# Copy the backend source code
COPY Backend/ ./Backend/
# Copy the compiled React frontend into the backend's wwwroot
COPY --from=build-frontend /src/Backend/wwwroot ./Backend/wwwroot
WORKDIR /src/Backend
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# 3. Create the Runtime Server Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
# Copy the final published .NET app (which now includes the React wwwroot files)
COPY --from=build-backend /app/publish .

# Render exposes port 10000 to the internet by default, but standard Docker apps can listen on 8080
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# This matches the DLL name compiled from your .NET project 
ENTRYPOINT ["dotnet", "LeaveManagementSystem.API.dll"]
