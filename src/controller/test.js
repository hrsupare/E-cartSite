
// function solution(x){
// let z=['a','e','i','o','u']
// let countv=0
// let countc=0
// if(x.length==0) return 0
// for(var i=0;i<x[i].length;i++){
//    // for(let j=0;j<z.length;j++){
//         if(x[0][i]==(z[2])) countv++
//         else countc++
//    // }
    
// }
// return countv 
// }
// x= "Difficulty of sentence"
// let c =x.split(' ')
// let d= c.map((x)=>x.split(''))

// console.log(d)
// console.log(solution(d))



// function printAlphabets(option){
	
// 	//set the default value of i & j to print A to Z
// 	var i = 65;
// 	var j = 91;
 
// 	//if the option is small set the value of i,j to print a to z
// 	if(option == 'small'){
// 		i = 97;
// 		j = 123; 
// 	}
 
// 	//loop through the values from i to j
// 	for(k = i; k < j; k++){
// 		//convert the char code to string (Alphabets)
// 		var str =String.fromCharCode(k);
// 		//print the result in console
//                 console.log(str);
// 	}
 
// }

// printAlphabets('small')

function solution(s){
    let z=['a','e','i','o','u']
    
    for(let i=0;i<s.length;i++){
        for(let j=0;j<s.length;j++){
        if(s[i].includes(z[i]))   
         temp= s[i]

    }
    }
    console.log()
}
let q= "hello world"
let s=q.split("")
console.log(solution(s))