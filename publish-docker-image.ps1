# Define version components
$MajorVersion = "1"
$MinorVersion = "2"

# Create date-based tag (e.g., 1.6.20250217)
$ImgVersionTag = "$MajorVersion.$MinorVersion.$((Get-Date -Format 'yyyyMMdd'))"
Write-Host "Building and publishing version: $ImgVersionTag"

# Define project and ACR details
$ProjectName = "gpt-image-1-playground"
$Dockerfile = Join-Path $PSScriptRoot "Dockerfile"
$AcrName = "gptimage1playground"
$RepositoryName = "$AcrName.azurecr.io/$ProjectName"
$FullImageNameLatest = "$RepositoryName`:latest"
$FullImageNameVersioned = "$RepositoryName`:$ImgVersionTag"

# Set Azure subscription (adjust if needed)
# az account set -s <your-subscription-id>
# Write-Host "Using Azure subscription: $(az account show --query name -o tsv)"

# Login to Azure Container Registry
Write-Host "Logging into ACR: $AcrName.azurecr.io..."
az acr login -n $AcrName
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to login to ACR: $AcrName"
    exit 1
}

# Verify we have the required files
if (-not (Test-Path $Dockerfile)) {
    Write-Error "Dockerfile not found at: $Dockerfile"
    exit 1
}

$PackageJsonPath = Join-Path $PSScriptRoot "package.json"
if (-not (Test-Path $PackageJsonPath)) {
    Write-Error "package.json not found at: $PackageJsonPath"
    exit 1
}

# Display project information
Write-Host "Project: $ProjectName"
Write-Host "Docker context: $PSScriptRoot"
Write-Host "Dockerfile: $Dockerfile"

# Build the Docker image
Write-Host "Building Docker image using $Dockerfile..."
Write-Host "Building image: $FullImageNameVersioned"
docker build -t $FullImageNameVersioned -f $Dockerfile $PSScriptRoot
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build Docker image."
    exit 1
}

# Tag the image as latest
Write-Host "Tagging image as latest: $FullImageNameLatest"
docker tag $FullImageNameVersioned $FullImageNameLatest
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to tag image as latest."
    exit 1
}

# Push the versioned tag
Write-Host "Pushing versioned image: $FullImageNameVersioned"
docker push $FullImageNameVersioned
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to push versioned image: $FullImageNameVersioned"
    exit 1
}

# Push the latest tag
Write-Host "Pushing latest image: $FullImageNameLatest"
docker push $FullImageNameLatest
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to push latest image: $FullImageNameLatest"
    exit 1
}

Write-Host "Script completed successfully."
Write-Host "Pushed images:"
Write-Host "- $FullImageNameVersioned"
Write-Host "- $FullImageNameLatest"

# Print the command to run the container
$RunCommand = "docker run --name gpt-image-1-playground -p 3366:3366 -e OPENAI_API_KEY=your-openai-api-key -e OPENAI_API_BASE_URL=https://litellm.wus2.sample-dev.azgrafana-test.io $FullImageNameVersioned"
Write-Host ""
Write-Host "Command to run the container:"
Write-Host $RunCommand
Write-Host ""
Write-Host "Note: Replace 'your-openai-api-key' with your actual OpenAI API key"
Write-Host "The application will be available at http://localhost:3366"
