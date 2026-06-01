import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import sessionsRouter from "./sessions";
import goalsRouter from "./goals";
import tasksRouter from "./tasks";
import flashcardsRouter from "./flashcards";
import quizzesRouter from "./quizzes";
import chatsRouter from "./chats";
import pdfsRouter from "./pdfs";
import revisionsRouter from "./revisions";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(sessionsRouter);
router.use(goalsRouter);
router.use(tasksRouter);
router.use(flashcardsRouter);
router.use(quizzesRouter);
router.use(chatsRouter);
router.use(pdfsRouter);
router.use(revisionsRouter);
router.use(notificationsRouter);

export default router;
