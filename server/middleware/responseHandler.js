module.exports = responseHandler;

function responseHandler(response, req, res, next) {
    if (typeof response === 'string') {
        // custom application error
        console.log(response);
        
        let statusCode = response.toLowerCase().endsWith('not found') ? 404 : 400;
        
        if (response.toLowerCase().includes('unauthorized')) {
            statusCode = 403;
        }
        
        return res.status(200).json({ status: statusCode, success: false, message: response });
    } 
    else if (response.success === true) {
        return res.status(200).json(response);
    } 
    else if (response.success === false) {
        return res.status(200).json({ status: response.status, success: false, message: response.message });
    } 
    else {
        return res.status(200).json({ status: 500, success: false, message: response.message });
    }
}



