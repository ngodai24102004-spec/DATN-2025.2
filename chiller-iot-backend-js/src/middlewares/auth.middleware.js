import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Yêu cầu đăng nhập" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
        req.user = decoded; // { id, role, buildingId }
        next();
    } catch (error) {
        res.status(403).json({ message: "Phiên đăng nhập hết hạn" });
    }
};