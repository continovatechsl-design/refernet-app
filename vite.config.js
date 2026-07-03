[build]
  command = "npm run build"
  publish = "dist"

# React Router uses client-side routing (e.g. /ref/ABC123, /dashboard) —
# without this, refreshing on any page other than "/" gives a 404 on Netlify.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
