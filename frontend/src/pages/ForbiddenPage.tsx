import { useNavigate } from "react-router-dom";
import { ROUTES } from "../config";

const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-24 w-24 text-red-500">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            403 - 权限不足
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            抱歉，您没有权限访问此资源
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回上一页
          </button>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回首页
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            如果您认为这是个错误，请联系系统管理员
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
