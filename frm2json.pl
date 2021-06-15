#!/usr/bin/perl

use strict;
use warnings;

#

use File::Find;
use File::Spec;
use JSON;

#

my( %json, @frm, @png );

#

sub findFrm
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

    push( @frm, $file ) if( $extension eq '.frm' );
    push( @frm, $file ) if( $extension =~ /\.fr[0-5]/ )
}

#

sub findPng
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

    push( @png, $file ) if( $extension eq '.png' );
}

#

sub json_info
{
    my %root;

    my $repo = `git remote get-url origin`;
    chomp($repo);

    $repo =~ s![/]+$!!;
    $repo =~ s!\.git$!!;
    $repo .= "/";

    if( $repo =~ m!^https\://github\.com/(.+)/(.+)/$! )
    {
        my( $owner, $name, $branch ) = ( $1, $2, `git branch --format "%(refname:short)"` );
        chomp($branch);

        $root{'url'}{'repository'} = $repo;
        $root{'url'}{'repository-raw'} = sprintf( "https://raw.githubusercontent.com/%s/%s/%s/", $owner, $name, $branch );

        $root{'url'}{'pages'} = sprintf( "https://%s.github.io/%s/", $owner, $name );
    }

    $json{'fallout-animations'}{'INFO'} = \%root
        if( scalar(keys( %root )));
}

#

sub json_frm
{
    my %root;

    foreach my $frm ( sort {$a cmp $b} @frm )
    {
        $frm =~ s!^\./!!;

        my( undef, $dir, $file ) = File::Spec->splitpath( $frm );

        $dir =~ s![/]+$!!;

        my $offset = 0;
        $offset = 1 if( $file =~ /^_/ );

        my $set = substr( $file, 0 + $offset, 6 );
        my $anim = uc(substr( $file, 6 + $offset, 2 ));

        printf( "??? $frm\n" ) if( $anim !~ /^[A-R][A-Z]$/ );

        next if( $anim eq 'NA' );

        # it's easier to store entries initially as arrays...

        push( @{ $root{"$dir"}{"$anim"} }, $file );
    }

    # ...and change them to string if they contain only one element

    foreach my $dir ( keys( %root ))
    {
        foreach my $anim ( keys( %{ $root{$dir} }))
        {
            if(scalar(@{ $root{$dir}{$anim} }) == 1)
            {
                my $value = $root{$dir}{$anim}[0];
                $root{$dir}{$anim} = $value;
            }
        }
    }

    $json{'fallout-animations'}{'frm'} = \%root
        if( scalar(keys( %root )));
}

#

sub json_png
{
    my %root;

    foreach my $png ( sort {$a cmp $b} @png )
    {
        $png =~ s!^\./!!;

        my( undef, $dir, $file ) = File::Spec->splitpath( $png );

        $dir =~ s!^docs/!!;
        $dir =~ s![/]+$!!;

        my $offset = 0;
        $offset = 1 if( $file =~ /^_/ );

        my $set  = substr( $file, 0 + $offset, 6 );
        my $anim = uc(substr( $file, 6 + $offset, 2 ));

        if( $file =~ /^[_]?$set$anim\.png$/ )
        {
            $root{"$dir"}{"$anim"}{'anim-packed'} = $file;
        }
        elsif( $file =~ /^[_]?$set$anim\_([0-5])\.png$/ )
        {
            push( @{ $root{"$dir"}{"$anim"}{'anim'} }, $file );
        }
        elsif( $file =~ /\.static\.png$/ )
        {
            push( @{ $root{"$dir"}{"$anim"}{'static'} }, $file );
        }
        else
        {
            print( "??? $file\n" );
        }
    }

    $json{'fallout-animations'}{'png'} = \%root
        if( scalar(keys( %root )));
}

#

sub json_txt
{
    my %root;

    $json{'fallout-animations-extra'}{'txt'} = \%root
        if( scalar(keys( %root )))
}

#

&find({ wanted => \&findFrm, no_chdir => 1 }, '.');
&find({ wanted => \&findPng, no_chdir => 1 }, 'docs' );

&json_info();
&json_frm();
&json_png();
&json_txt();

if( open( my $file, ">", "docs/fallout-animations.json" ))
{
    print( $file JSON->new->pretty->canonical->encode(\%json));
    close( $file );
}
else
{
    print( "Cannot write: docs/fallout-animations.json\n\n" );
    exit 1;
}
