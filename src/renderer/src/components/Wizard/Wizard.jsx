import { Outlet, useNavigate } from "react-router-dom";
import ProgressStepper from "./ProgressStepper";
import { useLocation } from "react-router-dom";
import { useState } from "react";


const Wizard = ({ routes, defaultState=null, rootRoute }) => {
    const { pathname } = useLocation();
    const navigate = useNavigate()
    const [state, setState] = useState(defaultState);

    const routeIndexFromPathname = (pathname) => {
        if (rootRoute == pathname) {
            return 0
        } else {
            const currentPathnameSplit = pathname.split("/")
            const activeStepPath = currentPathnameSplit[currentPathnameSplit.length - 1];
            for(const [index, route] of routes.entries()){
                console.log(index, route)
                if(route.path == activeStepPath)
                    return index;
            }
        }
    }
    const currentRouteIndex = routeIndexFromPathname(pathname);
    return <div className="wizard">
        <div className="progressStepper">
            <ProgressStepper routes={routes} rootRoute={rootRoute} />
        </div>
        <div className="wizardContent" style={{flexDirection: routes[currentRouteIndex]['layoutDirection']}}>
            <Outlet context={[state, setState]}/>
        </div>
        <div className="wizardActions">
            {currentRouteIndex == 0 ? '' : <button onClick={()=>navigate(`${rootRoute}/${routes[currentRouteIndex-1]['path']}`)}>Previous</button>}
            <button onClick={()=>navigate(`${rootRoute}/${routes[currentRouteIndex+1]['path']}`)}>{currentRouteIndex != routes.length-1 ? 'Next' : "Finish"}</button>
        </div>
    </div>
}

export default Wizard;