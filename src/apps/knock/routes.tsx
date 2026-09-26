import {Navigate, type RouteObject} from "react-router-dom";
import QuestionListPage from "@/apps/knock/pages/QuestionListPage.tsx";

export const knockRoutes: RouteObject[] = [
    { index: true, element: <Navigate to="question" replace /> },
    {
        path: "question",
        children: [
            { index: true, element: <QuestionListPage /> }
        ],
    },
];
