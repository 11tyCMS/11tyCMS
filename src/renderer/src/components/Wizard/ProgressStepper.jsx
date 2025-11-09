import { useLocation } from "react-router-dom";

function ProgressStepper({ routes, rootRoute }) {
    const { pathname } = useLocation();


    const isPathnameActiveRoute = (route) => {
        if (route.root && rootRoute == pathname) {
            return true
        } else {
            const currentPathnameSplit = pathname.split("/")
            const activeStepPath = currentPathnameSplit[currentPathnameSplit.length - 1];
            return activeStepPath == route.path;
        }
    }
    return routes.map((route, index) => <div className={`step ${isPathnameActiveRoute(route)? ' active' : ''}`}>
        <label>{index + 1}. {route.label}</label>
    </div>);
}

export default ProgressStepper;