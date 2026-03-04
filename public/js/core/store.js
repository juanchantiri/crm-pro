export const store = new Proxy({ clients: [], reminders: [] }, {
    set(target, property, value) {
        target[property] = value;
        window.dispatchEvent(new CustomEvent('stateChange', { detail: { property, value } }));
        return true;
    }
});