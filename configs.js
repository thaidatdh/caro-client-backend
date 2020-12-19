module.exports = {
  mongo: {
    username: "caro",
    server: "ptudwnc1731@caroonline.gixcz.mongodb.net",
    database: "caro",
  },
  user_types: {
    default: "USER",
    default_staff: "STAFF",
    data_staff: ["ADMIN", "STAFF"],
  },
  frontend_link: "http://app.data.com/",
  rank: {
    default: "Beginner",
    data: ["Beginner", "Intermediate", "Advanced", "Expert"],
  },
  userSchema: {
    default_photo_url:
      "https://material-ui.com/static/images/cards/contemplative-reptile.jpg",
  },
};
