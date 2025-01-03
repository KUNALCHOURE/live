import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useState } from 'react';
import { AuthContext } from '../context/authecontext';
import { Snackbar } from '@mui/material';

const theme = createTheme();



export default function SignUp() {

  const[username,setusername]=React.useState("");
  const [formstate,setformstate]=React.useState(0);
  const[fullname,setfullname]=React.useState("");
  const[password,setpassword]=React.useState("");
  const[error,seterror]=React.useState("");
  const[message,setmessage]=React.useState("");
 const[open,setopen]=React.useState(false);


 const { handleRegister, handlelogin } = React.useContext(AuthContext);
 let handleAuth=async()=>{
  try {
    if(formstate===0){
      let result=await handlelogin(username,password);
      console.log(result);
      setmessage(result);
      
      
  
    }
    if(formstate===1){
      let result=await handleRegister(fullname,username,password);
      console.log(result);
      setmessage(result);
      setopen(true);
      setusername("");
      seterror("");
      setformstate(0);
      setpassword("");
    }
  }
  catch (error) {
    console.log(error);
    let message = error.response?.data?.message || "An unexpected error occurred";
    seterror(message);
  }
  
 }


  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      fullName: data.get('fullName'),
      email: data.get('email'),
      password: data.get('password'),
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
     
          <div>
            <Button variant={formstate===0 ?"contained":""} onClick={()=> setformstate(0)}>
              Sign In
            </Button>

            <Button variant={formstate===1 ?"contained":""} onClick={()=> setformstate(1)}>
              Sign Up
            </Button>
          </div>

          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
             
              {formstate===1 ?
              <Grid item xs={12}>
              <TextField
                  autoComplete="given-name"
                  name="FullName"
                  required
                  fullWidth
                  id="FullName"
                  label="FullName"
                  autoFocus
                  onChange={(e)=>setfullname(e.target.value)}
                />
                </Grid>
              :<></>}

              <Grid item xs={12}>
                <TextField
                  autoComplete="given-name"
                  name="UserName"
                  required
                  fullWidth
                  id="UserName"
                  label="UserName"
                  autoFocus
                  value={username}
                  onChange={(e)=>setusername(e.target.value)}
                />
              </Grid>
             
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e)=>setpassword(e.target.value)}
                />
              </Grid>
            </Grid>
            <p style={{color:'red'}}>{error}</p>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleAuth}
            >
             {formstate===0 ? "Sign In": "Register"}
            </Button>
          </Box>
        </Box>
      </Container>

      <Snackbar
      open={open}
      autoHideDuration={400}
      message={message}
  
    />
    
    </ThemeProvider>
  );
}
