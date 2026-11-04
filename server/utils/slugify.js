// turns "Home & Beauty" into "home-beauty"
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = slugify;
