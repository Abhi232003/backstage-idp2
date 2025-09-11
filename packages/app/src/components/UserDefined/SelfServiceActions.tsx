import React from 'react';
import {
  Content,
  Header,
  Page,
  InfoCard,
} from '@backstage/core-components';
import {
  Grid,
  CardMedia,
  CardContent,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  card: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  cardMedia: {
    paddingTop: '30%', // A large icon feel
    fontSize: '4rem',
    textAlign: 'center',
    backgroundColor: theme.palette.grey[800],
    color: theme.palette.common.white,
  },
  cardContent: {
    flexGrow: 1,
  },
  link: {
    textDecoration: 'none',
  },
}));

const ActionCard = ({
  icon,
  title,
  description,
  templatePath,
}: {
  icon: string;
  title: string;
  description: string;
  templatePath: string;
}) => {
  const classes = useStyles();
  return (
    <Grid item xs={12} sm={6} md={4}>
      <RouterLink to={templatePath} className={classes.link}>
        <InfoCard className={classes.card}>
          <CardMedia className={classes.cardMedia}>{icon}</CardMedia>
          <CardContent className={classes.cardContent}>
            <Typography gutterBottom variant="h5" component="h2">
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {description}
            </Typography>
          </CardContent>
        </InfoCard>
      </RouterLink>
    </Grid>
  );
};

const SelfServicePage = () => (
  <Page themeId="tool">
    <Header title="Self Service Actions" subtitle="Create and manage your cloud resources with one-click actions." />
    <Content>
      <Grid container spacing={3}>
        <ActionCard icon="🪣" title="Provision S3 Bucket" description="Create a new, private S3 bucket for storing your application assets." templatePath="/create/templates/default/provision-s3-bucket" />
        <ActionCard icon="☁️" title="Create EC2 Instance" description="Launch a new EC2 virtual machine from a predefined template." templatePath="/create/templates/default/provision-ec2-instance" />
      </Grid>
    </Content>
  </Page>
);

export default SelfServicePage;
