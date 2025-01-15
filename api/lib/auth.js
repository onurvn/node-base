const passport = require("passport");
const { ExtractJwt, Strategy } = require("passport-jwt");

const config = require("../config");
const Users = require("../db/models/Users");
const UserRoles = require("../db/models/UserRoles");
const RolePrivileges = require("../db/models/RolePrivileges");
const privs = require("../config/Role-Privileges");
const Response = require("./Response");
const { HTTP_CODES } = require("../config/Enum");
const CustomError = require("./Error");

module.exports = () => {
    let strategy = new Strategy({
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }, async (payload, done) => {
        try {
            let user = await Users.findOne({ _id: payload.id });

            if (user) {
                let userRoles = await UserRoles.find({ user_id: payload.id });

                let rolePrivileges = await RolePrivileges.find({ role_id: { $in: userRoles.map(u => u.role_id) } });

                let priviles = rolePrivileges.map(role => privs.privileges.find(x => x.key == role.permission));

                done(null, {
                    id: user._id,
                    roles: priviles,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
                });
            } else {
                done(new Error("user not found"), null);
            }
        } catch (error) {
            done(error, null);
        }
    });
    passport.use(strategy);

    return {
        initialize: () => {
            return passport.initialize();
        },
        authenticate: () => {
            return passport.authenticate("jwt", { session: false });
        },
        checkRoles: (...expectedRoles) => {
            return (req, res, next) => {
                let i = 0;
                let privileges = req.user.roles.map(x => x.key);

                while (i < expectedRoles.length && !privileges.includes(expectedRoles[i])) i++;

                if (i >= expectedRoles.length) {
                    let response = Response.errorResponse(new CustomError(HTTP_CODES.UNAUTHORIZED, "need permission", "need permission"));
                    return res.status(response.code).json(response);
                }
                return next();
            }
        }
    }
}