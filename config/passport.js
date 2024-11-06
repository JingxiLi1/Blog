// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 加载用户模型
const User = require('../models/User');

module.exports = function(passport) {
  // 配置本地策略
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      // 根据邮箱查找用户
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return done(null, false, { message: '该邮箱尚未注册' });
      }

      // 验证密码
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: '密码错误' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // 序列化用户
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // 反序列化用户
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
