import { Router } from "express";
import * as challenge from "../controllers/challenge_controller";
import { verifyToken } from "../middleware/verify_token";
import {updateChallengeResultById} from "../controllers/challenge_controller";

const router = Router();

router.get("/challenge/getchallenge", challenge.getChallenge);
router.get(
  "/challenge/getChallengeByIdChallenge/:challenge_id",
  challenge.getChallengeByIdChallenge
);
router.post(
  "/challenge/createNewChallenge",
  verifyToken,
  challenge.createNewChallenge
);



router.post(
  "/challenge/createNewChallengeResult",
  verifyToken,
  challenge.createNewChallengeResult
);

router.post(
    "/challenge/updateChallengeResultById",
  verifyToken,
    challenge.updateChallengeResultById
);

router.get(
  "/challenge/getChallengeByIdChallengeResult/:challenge_uid",
  challenge.getChallengeByIdChallengeResult
);
router.get(
  "/challenge/getChallengeResultByIdChallenge/:challenge_uid",
  challenge.getChallengeResultByIdChallenge
);

router.get(
  "/challenge/getChallengeResultByChallengeAndUserId/:challenge_uid/:user_uid",
  challenge.getChallengeResultByChallengeAndUserId
);
export default router;
