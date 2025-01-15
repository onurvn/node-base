const express = require("express");
const router = express.Router();
const moment = require("moment")

const Response = require("../lib/Response");
const AuditLogs = require("../db/models/AuditLogs");
const auth = require("../lib/auth")();

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

router.post("/", auth.checkRoles("auditlogs_view"), async (req, res) => {
  let body = req.body;
  let query = {};
  let skip = body.skip;
  let limit = body.limit;

  try {
    if (typeof body.skip !== "number") {
      skip = 0;
    }

    if (typeof body.limit !== "number" || body.limit > 500) {
      limit = 500;
    }

    let auditLogs = await AuditLogs.find(query).sort({ created_at: -1 }).skip(skip).limit(limit);

    if (body.begin_date && body.end_date) {
      query.created_at = {
        $gte: moment(body.begin_date),
        $lte: moment(body.end_date)
      }
    } else {
      query.created_at = {
        $gte: moment().subtract(1, "day").startOf("day"),
        $lte: moment()
      }
    }


    res.json(Response.successResponse(auditLogs));


  } catch (error) {
    let errorResponse = Response.errorResponse(error, req.user?.language);
    res.status(errorResponse.code).json(Response.errorResponse(error));
  }
});

module.exports = router;
