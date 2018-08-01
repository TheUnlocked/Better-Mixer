export default class User {
    /**
     * A new user only must have a username. populateUser() must be called in order to fill the user with all relevant information.
     * @param {Object} data 
     */
    constructor(data){

        this._loadUser = (data) => {
            this.username = data.username;
            this.id = data.id;
            this.level = data.level;
            this.experience = data.experience;
            this.sparks = data.sparks;
            this.pro = false;
            this.partnered = false;
            this.staff = false;

            if ('groups' in data){
                for (let group of data.groups){
                    switch(group.name){
                        case "Pro":
                            this.pro = true;
                            break;
                        case "Partner":
                            this.partnered = true;
                            break;
                        case "Staff":
                            this.staff = true;
                    }
                }
            }
        };

        this._loadUser(data);
    }

    populateUser(){
        $.ajax({
            url: `https://mixer.com/api/v1/channels/${channelName}`,
            dataType: 'json',
            async: false,
            success: data => {
                this._loadUser(data);
            },
            error: xhr => this.plugin.log(`${xhr.statusText}: Failed to get channel ${channelName}`, BetterMixer.LogType.ERROR)
        });
    }
}