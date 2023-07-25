import { Router } from "express";
import usersModel from "../dao/models/usersModel.js";
import { ADMIN_USER, ADMIN_PASS } from "../utils/adminConfig.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, password } = req.body;

    if (email.toLowerCase() === ADMIN_USER.toLowerCase()) {
      return res.status(400).send({ status: 0, msg: "El usuario ya existe" });
    }

    const exists = await usersModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (exists) {
      return res.status(400).send({ status: 0, msg: "El usuario ya existe" });
    }

    const user = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      dateOfBirth,
      password,
    };

    await usersModel.create(user);

    req.session.user = {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      userRole: "user",
    };

    res.send({ status: 1, msg: "Nuevo usuario registrado" });
  } catch (error) {
    res.status(500).send({ status: 0, msg: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user;

    if (email.toLowerCase() === ADMIN_USER.toLowerCase()) {
      if (password !== ADMIN_PASS) {
        return res
          .status(400)
          .send({ status: 0, msg: "La contraseña es incorrecta" });
      }

      user = {
        firstName: "Admin",
        lastName: "Coder",
        email: ADMIN_USER,
        dateOfBirth: "",
        userRole: "admin",
      };
    } else {
      user = await usersModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
      });
      if (!user) {
        return res
          .status(400)
          .send({ status: 0, msg: "El nombre de usuario es incorrecto" });
      }
      if (user.password !== password) {
        return res
          .status(400)
          .send({ status: 0, msg: "La contraseña es incorrecta" });
      }
      user = { ...user.toObject(), userRole: "user" };
    }

    req.session.user = {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      userRole: user.userRole,
    };

    res.send({
      status: 1,
      msg: "Usuario logueado correctamente",
      user: req.session.user,
    });
  } catch (error) {
    res.status(500).send({ status: 0, msg: error.message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy();
  res.send({ status: 1, msg: "Usuario deslogueado correctamente" });
});

export default router;
