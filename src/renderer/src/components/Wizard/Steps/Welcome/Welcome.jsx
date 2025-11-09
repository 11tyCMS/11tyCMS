import { useOutletContext } from 'react-router-dom';
import icon from '../../../../assets/logo.png';

function Welcome() {
    const [wizardState, updateWizardState] = useOutletContext();
    return <>
    <img className={"logo"} src={icon} width={104}/>
    <p>Welcome to 11ty CMS! <br/>You've not opened this site in 11tyCMS before, so we just need to configure a few things before we get started. </p>
    </>;
}

export default Welcome; 