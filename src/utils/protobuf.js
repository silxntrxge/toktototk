const protobuf = require('protobufjs');

const loadProtoFile = async (protoPath) => {
    const root = await protobuf.load(protoPath);
    return root;
};

const encodeMessage = (root, messageType, payload) => {
    const Message = root.lookupType(messageType);
    const message = Message.create(payload);
    return Message.encode(message).finish();
};

const decodeMessage = (root, messageType, buffer) => {
    const Message = root.lookupType(messageType);
    const message = Message.decode(buffer);
    return Message.toObject(message);
};

module.exports = { loadProtoFile, encodeMessage, decodeMessage };