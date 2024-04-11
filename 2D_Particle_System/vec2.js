class vec2
{
    constructor(x,y)
    {
        this.x = x;
        this.y = y;
    }

    fromArray(v) //Creates a vector from an array
    {
        this.x = v.x;
        this.y = v.y;
    }

    add(v) //Adds another vector to this one
    {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) //Substracts another vector to this one
    {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    scale(a) //Scales the vector for a given factor a 
    {
        this.x *= a;
        this.y *= a;
        return this;
    }

    dot(v) //Compute the dot product
    {
        return this.x * v.x + this.y * v.y;
    }

    length() //Compute the lenght of the vector
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    normalize() //Normalize the vector
    {
        const len = this.length()
        if(len > 0.0001)
            this.scale(1/len);
        
        else
        {
            const e = new Error("Vector with length equal to 0 is not normalizable");
            throw e;
        }
    }

    distance(pt) //Compute distance to another point
    {
        var vec = new vec2(pt.x - this.x, pt.y - this.y);
        return vec.length()
    }
}