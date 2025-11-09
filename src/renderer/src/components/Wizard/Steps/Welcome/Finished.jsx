import mascott from '../../../../assets/mascott.avif'
function Finished() {
    return <>
    <img src={mascott} height={205}/>
    <p>That's everything!<br/>Once you press finish, your site will have its freshly minted <code>_11tycms.json</code> file with all your settings. This can be edited manually at any time, or alternatively, you can return to this welcome wizard to change the settings by going to your websites dashboard. <br/>Happy blogging!</p>
    </>;
}

export default Finished;