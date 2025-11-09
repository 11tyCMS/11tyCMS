import { Outlet, useNavigate } from "react-router-dom";
import ProgressStepper from "./ProgressStepper";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";


const Wizard = ({ routes, defaultState = null, rootRoute }) => {
    if (!rootRoute) {
        throw new Error(`You must specify the root route of this wizard!\nCurrent value: ${rootRoute}`)
    }
    const { pathname } = useLocation();
    const navigate = useNavigate()
    const [state, setState] = useState(defaultState);

    const routeIndexFromPathname = (pathname) => {
        if (rootRoute == pathname) {
            return 0
        } else {
            const currentPathnameSplit = pathname.split("/")
            const activeStepPath = currentPathnameSplit[currentPathnameSplit.length - 1];
            for (const [index, route] of routes.entries()) {
                if (route.path == activeStepPath)
                    return index;
            }
        }
    }
    const currentRouteIndex = routeIndexFromPathname(pathname);
    const [permittedSteps, setPermittedSteps] = useState(["", rootRoute]);
    useEffect(() => {
        if (routes[currentRouteIndex + 1])
            setPermittedSteps([routes[currentRouteIndex + 1].path])
    }, [])

    const permitNextStep = () => setPermittedSteps([...permittedSteps, routes[currentRouteIndex + 1].path])
    
    const isNextStepPermitted = () => {
        if (currentRouteIndex + 1 >= routes.length) {
            return true;
        } else {
            return permittedSteps.includes(routes[currentRouteIndex + 1].path)
        }
    }

    return <div className="wizard">
        <div className="progressStepper">
            <ProgressStepper routes={routes} rootRoute={rootRoute} />
        </div>
        <div className="wizardContent" style={{ flexDirection: routes[currentRouteIndex]['layoutDirection'] }}>
            <Outlet context={[state, setState, permitNextStep, isNextStepPermitted()]} />
        </div>
        <div className="wizardActions">
            {currentRouteIndex == 0 ? '' : <button onClick={() => navigate(`${rootRoute}/${routes[currentRouteIndex - 1]['path']}`)}>Previous</button>}
            <button onClick={() => navigate(`${rootRoute}/${routes[currentRouteIndex + 1]['path']}`)} disabled={!isNextStepPermitted()}>{currentRouteIndex != routes.length - 1 ? 'Next' : "Finish"}</button>
        </div>
    </div>
}

export default Wizard;