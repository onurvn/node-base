var express = require("express");
var router = express.Router();
const fs = require("fs");

const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/log/LoggerClas");
const Enum = require("../config/Enum");
const config = require("../config");
const auth = require("../lib/auth")();
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANG);
const emitter = require("../lib/Emitter");
const Export = new (require("../lib/Export"))();
const multer = require("multer");
const path = require("path");
const Import = new (require("../lib/Import"))();

let multerStorage = multer.diskStorage({
  destination: (req, file, next) => {
    next(null, config.FILE_UPLOAD_PATH)
  },
  filename: (req, file, next) => {
    next(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({ storage: multerStorage }).single("pb_file");

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

/* GET Categories listing. */
// eslint-disable-next-line no-unused-vars
router.get("/", auth.checkRoles("category_view"), async (req, res, next) => {
  try {
    let categories = await Categories.find({});

    res.json(Response.successResponse(categories));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(Response.errorResponse(error));
  }
});

//add
router.post("/add", auth.checkRoles("category_add"), async (req, res) => {
  let body = req.body;

  try {
    if (!body.name)
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["name"]));

    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id,
    });

    await category.save();

    AuditLogs.info(req.user?.email, "Categories", "Add", category);
    logger.info(req.user?.email, "Categories", "Add", category);
    emitter.getEmitter("notifications").emit("messages", { message: category.name + "is added" });

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    logger.error(req.user?.email, "Categories", "Add", error);
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// update
router.post("/update", auth.checkRoles("category_update"), async (req, res) => {
  let body = req.body;

  try {
    if (!body._id)
      throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"]));

    let updates = {};

    if (body.name) updates.name = body.name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    await Categories.updateOne({ _id: body._id }, updates);

    AuditLogs.info(req.user?.email, "Categories", "Update", { _id: body._id, ...updates });

    res.json(Response.successResponse({ success: true }));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

//delete
router.post("/delete", auth.checkRoles("category_delete"), async (req, res) => {
  let body = req.body;

  try {
    if (!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"]));

    await Categories.deleteOne({ _id: body._id });

    AuditLogs.info(req.user?.email, "Categories", "Delete", { _id: body._id });

    res.json(Response.successResponse({ success: true }));

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

//export
router.post("/export", auth.checkRoles("category_export"), async (req, res) => {
  try {
    let categories = await Categories.find({});

    let excel = Export.toExcel(
      ["NAME", "IS_ACTIVE", "USER_ID", "CREATED_AT", "UPDATED_AT"],
      ["name", "is_active", "created_by", "created_at", "updated_at"],
      categories
    )

    let filePath = __dirname + "/../tmp/categories_excell" + Date.now() + ".xlsx";

    fs.writeFileSync(filePath, excel, "UTF-8");

    res.download(filePath);

    // fs.unlinkSync(filePath);

  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(Response.errorResponse(error));
  }
});

//import
router.post("/import", auth.checkRoles("category_add"), upload, async (req, res) => {
  try {

    let file = req.file;
    let body = req.body;

    let rows = Import.fromExcel(file.path);

    for (let i = 1; i < rows.length; i++) {
      
      let [name, is_active, user, created_at, updated_at] = rows[i];

      if (name) {
        await Categories.create({
          name,
          is_active,
          created_by: req.user._id
        });
      }
    }

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse(req.body, Enum.HTTP_CODES.CREATED));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(Response.errorResponse(err));
  }
})

module.exports = router;
