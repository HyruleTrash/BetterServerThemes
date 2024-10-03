/**
 * @name BetterServerThemes
 * @author TrashElf
 * @description Changes your theme depending on the server you are in.
 * @version 0.0.1
 */

module.exports = class BetterServerThemes {
    constructor(meta) {
        this.meta = meta;
        this.SideBarNextToServerListObserver = null; // MutationObserver for the sidebar that contains the name of the server
        this.serverIconsObserver = null; // MutationObserver for the server icons, to get the server names

        this.currentServer = null; // The current server name
        this.knownServers = []; // List of known servers, taken from the server icons
        this.settings = {}; // Settings for the plugin, which theme is enabled for which server
    }

    // This function is called when the plugin is started
    start() {
        // get the sidebar that contains the server name
        const SideBarNextToServerList = document.querySelector('.sidebar_a4d4d9');

        // If the sidebar is found and the observer is not set, create a new observer
        // if a change is triggered, update the current server name
        if (!this.SideBarNextToServerListObserver && SideBarNextToServerList) {
            // Create a MutationObserver instance
            this.SideBarNextToServerListObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        // Get the current server name
                        this.updateCurrentServer(SideBarNextToServerList);
                    }
                });
            });

            const config = { childList: true, subtree: true };

            this.SideBarNextToServerListObserver.observe(SideBarNextToServerList, config);
            
            // Get the current server name, because the observer is not triggered on the first start
            this.updateCurrentServer(SideBarNextToServerList);
        }

        // get the server icons container
        const serverIconContainer = document.querySelector('.scroller_fea3ef');

        // If the server icons container is found and the observer is not set, create a new observer
        // if a change is triggered, update the known server list
        if (!this.serverIconsObserver && serverIconContainer) {
            // Create a MutationObserver instance
            this.serverIconsObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        this.updateKnownServerList();
                    }
                });
            });

            const config = { childList: true, subtree: true };

            this.serverIconsObserver.observe(serverIconContainer, config);
        }

        // Get the known servers, since the observer is not triggered yet
        this.updateKnownServerList();
    }

    // This function is called when the plugin is stopped
    stop() {
        // Disconnect the observers
        if (this.SideBarNextToServerListObserver) {
            this.SideBarNextToServerListObserver.disconnect();
            this.SideBarNextToServerListObserver = null;
        }
        if (this.serverIconsObserver) {
            this.serverIconsObserver.disconnect();
            this.serverIconsObserver = null;
        }
    }

    // This function is called by the start function, to get the current server name that the user is in
    // It also gets triggered by an observer when the server name changes
    updateCurrentServer(SideBarNextToServerList) {
        // Get the server name from the sidebar
        let serverName = SideBarNextToServerList.querySelector('.container_ee69e0');
        let foundServerName = "";
        if (serverName) {
            foundServerName = serverName.ariaLabel.replace("(server)", "").trim();
        }else {
            // If the server name is not found, set the server name to "Default", for if the user is not in a server for example
            foundServerName = "Default";
        }

        // If the server name is different from the current server name, update the themes
        // Meaning the user switched servers
        if (foundServerName !== this.currentServer) {
            this.currentServer = foundServerName;

            this.settings = BdApi.Data.load("BetterServerThemes", "settings");
            if (this.settings[this.currentServer]) {
                this.updateThemes(this.currentServer);
            }else if (this.settings["default"]) {
                this.updateThemes("Default");
            }
        }
    }

    // a function to update the themes depending on the server
    updateThemes(server) {
        let themes = BdApi.Themes.getAll();
        let serverThemes = this.settings[server];
        
        themes.forEach(theme => {
            if (serverThemes[theme.name] == true) {
                if (!BdApi.Themes.isEnabled(theme.name)) {
                    BdApi.Themes.enable(theme.name);
                }
            } else if (serverThemes[theme.name] == false) {
                if (BdApi.Themes.isEnabled(theme.name)) {
                    BdApi.Themes.disable(theme.name);
                }
            }
        });
    }

    // a function to update the known servers, based on the server icons
    updateKnownServerList() {
        let serverIcons = document.querySelectorAll('.blobContainer_a5ad63');
        if (serverIcons !== null) {
            this.knownServers = [];
            this.knownServers.push({name:"Default", id:"default"});
            if (serverIcons.length > 1) {
                // Handle multiple elements (querySelectorAll was used)
                let counter = 0;
                serverIcons.forEach(element => {
                    counter++;
                    this.knownServers.push({name:element.getAttribute('data-dnd-name'), id:counter});
                });
            } else {
                // Handle single element
                this.knownServers.push({name:element.getAttribute('data-dnd-name'), id:0});
            }
        }
    }
    
    // a function to render the server list in the settings panel
    renderServerList() {
        let ul = document.createElement("ul");
        ul.id = "serverListBetterServerThemes";
        ul.classList = "list-group list-group-flush text-light";

        let themes = BdApi.Themes.getAll();
        
        this.knownServers.forEach(server => {
            ul.appendChild(this.renderServerListItem(server, themes));
        })
    
        return ul;
    }

    // a function to render a server list item in the settings panel
    renderServerListItem(server, themes) {
        let li = document.createElement("div");
        li.classList = "list-group-item";

        let button = document.createElement("button");
        button.classList = "dropdown-toggle better-server-themes-dropdown-toggle better-server-themes-dropdown-toggle-up";
        button.setAttribute("dropdown-clicked", "false");
        button.type = "button";
        button.id = "dropdownMenuButton"+server.id;
        button.innerText = server.name;
        
        // Add a click event to the button. for dropdown functionality
        button.onclick = function(event) {
            let dropdownMenu = document.querySelector(`.dropdown-menu-better-server-themes[aria-labelledby="${this.id}"]`);

            if (dropdownMenu){
                if (this.getAttribute("dropdown-clicked") === "false") {
                    this.setAttribute("dropdown-clicked", "true");
                    this.classList.remove("better-server-themes-dropdown-toggle-up");
                    this.classList.add("better-server-themes-dropdown-toggle-down");

                    // Show the dropdown
                    dropdownMenu.classList.add("dropdown-menu-better-server-themes-open");
                    dropdownMenu.classList.remove("dropdown-menu-better-server-themes-closed");
                } else {
                    this.setAttribute("dropdown-clicked", "false");
                    this.classList.remove("better-server-themes-dropdown-toggle-down");
                    this.classList.add("better-server-themes-dropdown-toggle-up");

                    // Hide the dropdown
                    dropdownMenu.classList.add("dropdown-menu-better-server-themes-closed");
                    dropdownMenu.classList.remove("dropdown-menu-better-server-themes-open");
                }
            }
        };
        li.appendChild(button);

        let dropdown = document.createElement("ul");
        dropdown.classList = "dropdown-menu-better-server-themes dropdown-menu-better-server-themes-closed";
        dropdown.setAttribute("aria-labelledby", "dropdownMenuButton"+server.id);
        li.appendChild(dropdown);

        themes.forEach(theme => {
            dropdown.appendChild(this.renderThemeListItem(theme.name, server.id, this.settings[server.name][theme.name]));
        });

        return li;
    }

    // a function to render a theme list item in the settings panel, for a specific server
    renderThemeListItem(theme, serverId, isChecked) {
        let liTwo = document.createElement("li");
        liTwo.classList = "dropdown-menu-better-server-themes-item";

        let label = document.createElement("label");
        label.innerText = theme;
        label.for = "themeSwitch_"+theme+"_"+serverId;
        liTwo.appendChild(label);

        let div = document.createElement("div");
        div.classList = "form-check form-switch";

        let input = document.createElement("input");
        input.classList = "form-check-input";
        input.type = "checkbox";
        input.role = "switch";
        input.id = "themeSwitch_"+theme+"_"+serverId;
        input.checked = isChecked;
        div.appendChild(input);

        liTwo.appendChild(div);
        return liTwo;
    }

    // a function to render the settings panel
    getSettingsPanel() {
        let rootElm = document.createElement("div");
        rootElm.classList = "card bg-dark text-light";

        // retrieve settings for plugin to display
        try {
            this.settings = BdApi.Data.load("BetterServerThemes", "settings");
        } catch (error) {
            console.error(error);
        }

        // add bootstrap
        let link = document.createElement("link");
        link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
        link.rel = "stylesheet";
        rootElm.appendChild(link);

        //custom style
        let style = document.createElement("style");
        style.innerHTML = `.list-group-item {    background: #36393f;    color: #ffffff;    border: 1px solid #111226ba;}.input-group-text {    background: #36393f;    color: #ffffff}.form-control {    background-color: #36393f;    color: #ffffff}.form-control:focus {    background-color: #46494f;    color: #ffffff}.dropdown-menu-better-server-themes>li {    padding: 0.5rem 0;    border-top: solid 1px #111226ba;}.dropdown-menu-better-server-themes>li:first-child {    border-top: none !important;}.better-server-themes-dropdown-toggle {    background: none;    color: white;    width: 100%;    text-align: left;    display: flex;    justify-content: space-between;    margin: 0.5rem 0 0 0;}.better-server-themes-dropdown-toggle-up{    margin: 0.5rem 0;}.better-server-themes-dropdown-toggle::after {    align-self: center;    display: inline-block;    margin-left: .255em;    vertical-align: .255em;    content: "";}.better-server-themes-dropdown-toggle-up::after {    border-bottom: .3em solid;    border-right: .3em solid transparent;    border-top: 0;    border-left: .3em solid transparent;}.better-server-themes-dropdown-toggle-down::after {    border-top: .3em solid;    border-right: .3em solid transparent;    border-bottom: 0;    border-left: .3em solid transparent;}.dropdown-menu-better-server-themes {    padding: 1rem;    margin: 0.5rem 0;    background-color: rgb(10 14 32 / 24%);    border-radius: 0.375rem;    overflow: hidden;    height: auto;    transition-duration: 2s;}.dropdown-menu-better-server-themes-closed {    max-height: 0px !important;    padding-top: 0;    padding-bottom: 0;    margin: 0;    transition-duration: 2s;    overflow: hidden;}.dropdown-menu-better-server-themes-open {    max-height: 200px !important;    transition-duration: 2s;    overflow-y: scroll;}.dropdown-menu-better-server-themes-item {    display: flex;    justify-content: space-between;    align-items: center;}`;
        rootElm.appendChild(style);

        // Copntainer element, to hold the UI elements
        let canvas = document.createElement("div");
        canvas.innerHTML = '<h5 class="card-title">Your servers and connected theme settings:</h5>';
        canvas.classList = "card-body";

        // List wrapper, holds the server list
        let listWrapper =  document.createElement("form");
        listWrapper.id = "listWrapper";
        listWrapper.appendChild(this.renderServerList());
        canvas.appendChild(listWrapper);

        // Save button
        let saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.classList = "btn btn-primary mt-3";
        saveButton.innerText = "Save";
        saveButton.onclick = (event) => {
            event.preventDefault();

            let data = {};
            // Loop through the known servers and get the settings for each server
            this.knownServers.forEach(server => {
                data[server.name] = {};
                let dropdown = document.querySelector(`.dropdown-menu-better-server-themes[aria-labelledby="dropdownMenuButton${server.id}"]`);
                if (dropdown) {
                    let inputs = dropdown.querySelectorAll("input");
                    inputs.forEach(input => {
                        data[server.name][input.id.replace("themeSwitch_", "").replace("_"+server.id, "")] = input.checked;
                    });
                }
            })

            // Save the settings locally
            BdApi.Data.save("BetterServerThemes", "settings", data);

            // Update the current themes
            this.settings = data;
            this.updateThemes(this.currentServer, true);
        };
        canvas.appendChild(saveButton);

        rootElm.appendChild(canvas);
        
        return rootElm;
    }
};
