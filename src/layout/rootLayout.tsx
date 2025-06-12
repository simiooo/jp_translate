import { Outlet, useNavigate, useLocation } from "react-router";
import { Button } from "~/components/Button";
import { FaHome, FaArrowRight, FaBookmark,FaCameraRetro  } from "react-icons/fa";
import { Tooltip } from "~/components/Tooltip";
import { Switch } from "~/components/Switch";

// 公开路由，不需要认证
const PUBLIC_ROUTES = ["/login", "/register"];

export default function RootLayout() {
  // const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  // const [user, setUser] = useState<User | null>(null)
  // const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate();
  const location = useLocation();

  // // 检查认证状态
  // const checkAuth = async () => {
  //   try {
  //     setIsLoading(true)
  //     const token = localStorage.getItem('Authorization')

  //     if (!token) {
  //       setIsAuthenticated(false)
  //       setUser(null)
  //       return
  //     }

  //     // 验证token有效性
  //     const data = await alovaInstance.Get<{[key: string]: string | number} | null>("/api/translation")

  //     if (!data) {
  //       throw new Error('Not authenticated')
  //     }

  //     if ("message" in data) {
  //       throw new Error(String(data.message))
  //     }

  //     setIsAuthenticated(true)
  //     // 这里可以设置用户信息，如果API返回用户数据的话
  //     // setUser(data.user)

  //   } catch (error) {
  //     console.error('Authentication check failed:', error)
  //     setIsAuthenticated(false)
  //     setUser(null)
  //     localStorage.removeItem("Authorization")
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // useEffect(() => {
  //   checkAuth()
  // }, [])

  // // 路由守卫逻辑
  // useEffect(() => {
  //   if (isLoading) return

  //   const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname)

  //   if (!isAuthenticated && !isPublicRoute) {
  //     // 未认证且访问受保护路由，重定向到登录页
  //     navigate('/login', { replace: true })
  //   } else if (isAuthenticated && isPublicRoute) {
  //     // 已认证且访问公开路由，重定向到首页
  //     navigate('/', { replace: true })
  //   }
  // }, [isAuthenticated, isLoading, location.pathname, navigate])

  // // 登出函数
  // const logout = () => {
  //   localStorage.removeItem('Authorization')
  //   setIsAuthenticated(false)
  //   setUser(null)
  //   navigate('/login')
  // }

  // // 加载中显示全局加载器
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <GlobalSpinner />
  //     </div>
  //   )
  // }

  // 对于公开路由，直接渲染内容
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return <Outlet />;
  }

  // // 对于受保护的路由，检查认证状态
  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center">
  //         <h2 className="text-xl font-semibold text-gray-700 mb-2">请先登录</h2>
  //         <p className="text-gray-500">正在重定向到登录页...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // 认证成功，渲染主要内容
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="bg-white w-12 border-r border-gray-200 flex flex-col items-center p-2 space-y-2">
        <div>
          <Button
            size="sm"
            variant={location.pathname === "/" ? "normal" : "text"}
            onClick={() => {
              navigate("/");
            }}
          >
            <FaHome />
          </Button>
        </div>
        <div>
          <Button
            onClick={() => {
              navigate("/vocabulary");
            }}
            size="sm"
            variant={location.pathname === "/vocabulary" ? "normal" : "text"}
          >
            {" "}
            <FaBookmark />{" "}
          </Button>
        </div>
        <div>
          <Button
            onClick={() => {
              navigate("/recognize");
            }}
            size="sm"
            variant={location.pathname === "/recognize" ? "normal" : "text"}
          >
            <FaCameraRetro />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-end flex-col space-y-2">
          <div>
            <Switch />
          </div>
          <div>
            <Tooltip
            content="Sign Out"
            placement="right"
            >
              <Button 
              onClick={() => {
                localStorage.removeItem("Authorization");
                navigate("/login", { replace: true });
              }}
              variant="text">
              <FaArrowRight></FaArrowRight>
            </Button>
            </Tooltip>
            
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
